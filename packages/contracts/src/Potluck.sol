// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@chainlink/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/vrf/dev/VRFCoordinatorV2_5.sol";

/**
 * @title Potluck
 * @notice A recurring pool of token contributions where one random participant wins each period.
 *         Creator configures entry amount, period, optional max participants, and public access.
 *         Platform collects a fixed fee on creation, sent to `treasury`.
 */
contract Potluck is ReentrancyGuard, VRFConsumerBaseV2Plus {
    using SafeERC20 for IERC20;

    //––––––––––––––––––––
    // CUSTOM ERRORS
    //––––––––––––––––––––

    error EntryAmountZero();
    error PeriodTooShort();
    error PotDoesNotExist(uint256 potId);
    error RoundEnded(uint256 deadline, uint256 nowTimestamp);
    error PotFull(uint8 maxParticipants);
    error AlreadyJoined(uint256 potId, uint32 round, address user);
    error RoundNotReady(uint256 deadline, uint256 nowTimestamp);
    error InsufficientFundsToRollover(uint256 total, uint256 rollover);
    error InsufficientFundsForAutoJoin(uint256 sent, uint256 required);
    error NoEligibleParticipants();
    error NotPotCreator(address sender, uint256 potId);
    error NotAllowed(address user, uint256 potId);
    error NotAllParticipantsWon(uint256 potId);
    error TokenNotAllowed(address token);

    //––––––––––––––––––––
    // STATE
    //––––––––––––––––––––
    /// @notice Total number of pots created
    uint256 public potCount;
    /// @notice Fixed fee (wei) to create a pot
    uint256 public platformFee;
    /// @notice Fees per participant (wei)
    uint256 public participantFee;
    /// @notice Where all creation fees go
    address public treasury;
    /// @notice Potluck contract owner
    address public potluckOwner;
    /// @notice Chainlinks VRFCoordinator address
    VRFCoordinatorV2_5 public vrfCoordinator;

    // VRF configuration parameters
    bytes32 public keyHash;
    uint256 public s_subscriptionId;
    uint16 public requestConfirmations;
    uint32 public callbackGasLimit;

    struct PotRequest {
        address requestor;
        uint256 timestamp;
    }

    struct Pot {
        uint256 id;
        address creator;
        bytes name;
        uint32 round;
        uint256 deadline;
        uint256 balance;
        address token;
        uint256 entryAmount;
        uint256 period;
        uint8 totalParticipants;
        uint8 maxParticipants;
        address[] participants;
        bool isPublic;
    }

    mapping(uint256 => Pot) public pots;
    mapping(bytes32 => bool) public hasJoinedRound; // keccak(pot,round,user)
    mapping(bytes32 => bool) public hasWon; // keccak(pot,user)
    mapping(address => bool) public allowedTokens; // Allowed tokens for pot entry
    // Simple allow-list: potId => participant => allowed
    mapping(uint256 => mapping(address => bool)) public isAllowed;
    mapping(uint256 => PotRequest[]) public requestedParticipants;
    mapping(address => mapping(address => uint256)) public withdrawalBalances; // user => token => balance

    // Maps chainlink requestId to potId and round
    mapping(uint256 => uint256) public requestToPot;
    mapping(uint256 => uint32) public requestToRound;

    event PotCreated(uint256 indexed potId, address indexed creator);
    event PotJoined(uint256 indexed potId, uint32 roundId, address indexed user);
    event PotPayout(uint256 indexed potId, address indexed winner, uint256 amount, uint32 round);
    event PotAllowRequested(uint256 indexed potId, address indexed requestor);
    event AllowedParticipantAdded(uint256 indexed potId, address indexed user);
    event PotEnded(uint256 indexed potId);

    //––––––––––––––––––––
    // CONSTRUCTOR
    //––––––––––––––––––––

    constructor(uint256 _platformFee, uint256 _partFee, address _treasury, address _vrfCoordinator)
        VRFConsumerBaseV2Plus(_vrfCoordinator)
    {
        platformFee = _platformFee;
        treasury = _treasury;
        participantFee = _partFee;
        potluckOwner = msg.sender;
        vrfCoordinator = VRFCoordinatorV2_5(_vrfCoordinator);
    }

    modifier onlyPotluckOwner() {
        require(msg.sender == potluckOwner, "Not the potluck owner");
        _;
    }

    //––––––––––––––––––––
    // CREATE
    //––––––––––––––––––––

    /// @notice Create a new pot with the specified parameters.
    /// @param name Name of the pot (bytes)
    /// @param token Address of the ERC20 token used for entry
    /// @param entryAmount Amount required to enter the pot
    /// @param maxParticipants Maximum number of participants (0 for unlimited)
    /// @param periodSeconds Duration of each round in seconds (minimum 1 hour)
    /// @param isPublic Whether the pot is public or private
    function createPot(
        bytes memory name,
        address token,
        uint256 entryAmount,
        uint8 maxParticipants,
        uint256 periodSeconds,
        bool isPublic
    ) external payable nonReentrant {
        if (entryAmount == 0) revert EntryAmountZero();
        if (periodSeconds < 1 hours) revert PeriodTooShort();
        if (!allowedTokens[token]) revert TokenNotAllowed(token);

        // Initialize the pot
        uint256 potId = potCount++;
        Pot storage p = pots[potId];
        p.id = potId;
        p.creator = msg.sender;
        p.name = name;
        p.token = token;
        p.entryAmount = entryAmount;
        p.period = periodSeconds;
        p.totalParticipants = 1;
        p.deadline = block.timestamp + periodSeconds;
        p.balance = entryAmount;
        p.participants.push(msg.sender);
        p.isPublic = isPublic;
        p.maxParticipants = maxParticipants;

        if (!isPublic) {
            isAllowed[potId][msg.sender] = true;
        }

        // mark joined in round 0
        bytes32 key = keccak256(abi.encodePacked(potId, uint32(0), msg.sender));
        hasJoinedRound[key] = true;

        //  Collect the stake for the pot
        IERC20(token).safeTransferFrom(msg.sender, address(this), entryAmount);

        //  Collect fee to treasury
        uint256 requiredFee = getCreatorFee(maxParticipants);
        if (msg.value < requiredFee) {
            revert InsufficientFundsForAutoJoin(msg.value, requiredFee);
        }
        payable(treasury).transfer(requiredFee);
        // Transfer the platform fee to the treasury
        if (msg.value > requiredFee) {
            // Its sender's responsibility to ensure they can accept ETH.
            (bool success,) = msg.sender.call{value: msg.value - requiredFee}("");
        }

        emit PotCreated(potId, msg.sender);
        emit PotJoined(potId, 0, msg.sender);
    }

    //––––––––––––––––––––
    // ALLOW MANAGEMENT
    //––––––––––––––––––––

    /// @notice Pot creator can add allowed participants
    /// @param potId ID of the pot to allow participants in
    /// @param participants Array of addresses to allow
    function allowParticipants(uint256 potId, address[] calldata participants) external {
        Pot storage p = pots[potId];
        if (msg.sender != p.creator) revert NotPotCreator(msg.sender, potId);
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            if (!isAllowed[potId][participant]) {
                isAllowed[potId][participant] = true;
                emit AllowedParticipantAdded(potId, participant);
            }
        }
    }

    /// @notice Request to be allowed to join a private pot
    /// @param potId ID of the pot to request access to
    function requestPotAllow(uint256 potId) external {
        requestedParticipants[potId].push(
            PotRequest({requestor: msg.sender, timestamp: block.timestamp})
        );
        emit PotAllowRequested(potId, msg.sender);
    }

    //––––––––––––––––––––
    // JOIN
    //––––––––––––––––––––
    /// @notice Join a pot for the current round.
    /// @param potId ID of the pot to join
    function joinPot(uint256 potId) external payable nonReentrant {
        Pot storage p = pots[potId];
        if (p.balance == 0) revert PotDoesNotExist(potId);
        if (block.timestamp >= p.deadline) revert RoundEnded(p.deadline, block.timestamp);
        if (p.participants.length >= p.maxParticipants && p.maxParticipants != 0) revert PotFull(p.maxParticipants);
        if (!isAllowed[potId][msg.sender] && !p.isPublic) revert NotAllowed(msg.sender, potId);

        bytes32 key = keccak256(abi.encodePacked(potId, p.round, msg.sender));
        if (hasJoinedRound[key]) revert AlreadyJoined(potId, p.round, msg.sender);
        // only increment totalParticipants in the first round
        if (p.round == 0) {
            p.totalParticipants++;
            //  Collect fee to treasury
            uint256 requiredFee = getParticipantFee(p.maxParticipants);
            if (msg.value < requiredFee) {
                revert InsufficientFundsForAutoJoin(msg.value, requiredFee);
            }
            payable(treasury).transfer(requiredFee);
            if (msg.value > requiredFee) {
                // Its sender's responsibility to ensure they can accept ETH.
                (bool success,) = msg.sender.call{value: msg.value - requiredFee}("");
            }
        } else {
            if (!hasJoinedRound[keccak256(abi.encodePacked(potId, p.round - 1, msg.sender))]) {
                revert NotAllowed(msg.sender, potId);
            }
        }

        IERC20(p.token).safeTransferFrom(msg.sender, address(this), p.entryAmount);
        p.balance += p.entryAmount;
        p.participants.push(msg.sender);

        hasJoinedRound[key] = true;
        emit PotJoined(potId, p.round, msg.sender);
    }

    /// @notice Join a pot on behalf of another participant.
    /// @param potId ID of the pot to join
    /// @param participant Address of the participant to join on behalf of
    /// @dev This can only be called if the participant is allowed to join the pot and has already joined the previous round.
    function joinOnBehalf(uint256 potId, address participant) public nonReentrant {
        Pot storage p = pots[potId];
        if (p.balance == 0) revert PotDoesNotExist(potId);
        if (block.timestamp >= p.deadline) revert RoundEnded(p.deadline, block.timestamp);
        if (!isAllowed[potId][participant] && !p.isPublic) revert NotAllowed(participant, potId);
        if (p.round == 0) {
            revert NotAllowed(msg.sender, potId);
        }
        if (!hasJoinedRound[keccak256(abi.encodePacked(potId, p.round - 1, participant))]) {
            revert NotAllowed(participant, potId);
        }

        bytes32 key = keccak256(abi.encodePacked(potId, p.round, participant));
        if (hasJoinedRound[key]) revert AlreadyJoined(potId, p.round, participant);

        p.balance += p.entryAmount;
        p.participants.push(participant);

        hasJoinedRound[key] = true;
        IERC20(p.token).safeTransferFrom(participant, address(this), p.entryAmount);

        emit PotJoined(potId, p.round, participant);
    }

    //––––––––––––––––––––
    // PAYOUT
    //––––––––––––––––––––
    /// @notice Trigger the payout for the current round of a pot.
    /// @param potId ID of the pot to trigger payout for
    function triggerPotPayout(uint256 potId) public {
        Pot storage p = pots[potId];
        if (p.balance == 0) revert PotDoesNotExist(potId);
        if (block.timestamp < p.deadline) revert RoundNotReady(p.deadline, block.timestamp);

        // request randomness via Chainlink VRF v2.5
        uint256 requestId = vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: 1,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: true}))
            })
        );
        requestToPot[requestId] = potId;
        requestToRound[requestId] = p.round;
    }

    /// @notice End a pot and distribute remaining funds to all participants.
    /// @param potId ID of the pot to end
    /// @dev This can only be called after the pot's deadline has passed and all participants have won i.e. a non winner doesnt join the current round.
    function endPot(uint256 potId) public {
        Pot storage p = pots[potId];
        if (p.balance == 0) revert PotDoesNotExist(potId);
        if (block.timestamp < p.deadline) revert RoundNotReady(p.deadline, block.timestamp);
        for (uint256 i = 0; i < p.participants.length; i++) {
            if (!hasWon[keccak256(abi.encodePacked(potId, p.participants[i]))]) {
                revert NotAllParticipantsWon(potId);
            }
        }
        p.balance = 0;
        address token = p.token;
        uint256 entryAmount = p.entryAmount;
        for (uint256 i = 0; i < p.participants.length; i++) {
            withdrawalBalances[p.participants[i]][token] += entryAmount;
        }
        emit PotEnded(potId);
    }

    /// @dev Withdraw tokens from the contract
    /// @param token The address of the token to withdraw
    /// @param amount The amount of tokens to withdraw
    function withdraw(address token, uint256 amount) public nonReentrant {
        require(withdrawalBalances[msg.sender][token] >= amount, "Insufficient balance");
        withdrawalBalances[msg.sender][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    /// @dev Chainlink will call this with random words
    /// @notice Chainlink VRF callback with random words
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        uint256 potId = requestToPot[requestId];
        uint32 round = requestToRound[requestId];
        Pot storage p = pots[potId];

        uint256 len = p.participants.length;
        uint256 idx = randomWords[0] % len;
        address winner = p.participants[idx];

        hasWon[keccak256(abi.encodePacked(potId, winner))] = true;
        uint256 rollover = (round == p.totalParticipants - 1) ? 0 : p.entryAmount;
        uint256 prize = p.balance - rollover;

        emit PotPayout(potId, winner, prize, round);
        withdrawalBalances[winner][p.token] += prize;

        if (round == p.totalParticipants - 1) {
            p.balance = 0;
        } else {
            p.round = round + 1;
            p.balance = rollover;
            delete p.participants;
            p.participants.push(winner);
            hasJoinedRound[keccak256(abi.encodePacked(potId, p.round, winner))] = true;
            emit PotJoined(potId, p.round, winner);
            p.deadline = block.timestamp + p.period;
        }
    }

    //––––––––––––––––––––
    // OWNER ACTIONS
    //––––––––––––––––––––

    /// @notice Set the platform and participant fees
    /// @param _flatFee Fixed fee (wei) to create a pot
    /// @param _perPartFee Fees per participant (wei)
    function setFees(uint256 _flatFee, uint256 _perPartFee) external onlyPotluckOwner {
        platformFee = _flatFee;
        participantFee = _perPartFee;
    }

    /// @notice Set the treasury address where fees are sent
    /// @param newTreasury New treasury address
    function setTreasury(address newTreasury) external onlyPotluckOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
    }

    /// @notice Set the Chainlink VRF parameters
    /// @param _keyHash The key hash for the VRF
    /// @param _subscriptionId The subscription ID for the VRF
    /// @param _requestConfirmations Number of confirmations for the VRF request
    /// @param _callbackGasLimit Gas limit for the VRF callback
    function setChainlinkVRF(
        bytes32 _keyHash,
        uint256 _subscriptionId,
        uint16 _requestConfirmations,
        uint32 _callbackGasLimit
    ) external onlyPotluckOwner {
        keyHash = _keyHash;
        s_subscriptionId = _subscriptionId;
        requestConfirmations = _requestConfirmations;
        callbackGasLimit = _callbackGasLimit;
    }

    /// @notice Set the Chainlink VRF Coordinator address
    /// @param _vrfCoordinator Address of the Chainlink VRF Coordinator
    function setChainlinkVRF(address _vrfCoordinator) external onlyPotluckOwner {
        require(_vrfCoordinator != address(0), "Invalid VRF Coordinator address");
        vrfCoordinator = VRFCoordinatorV2_5(_vrfCoordinator);
    }

    /// @notice Withdraw all ETH from the contract to the treasury
    function withdraw() external onlyPotluckOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(treasury).transfer(balance);
    }

    /// @notice Allow a token for use in the potluck
    /// @param token The address of the token to allow
    function setTokenStatus(address token, bool status) external onlyPotluckOwner {
        require(token != address(0), "Invalid token address");
        allowedTokens[token] = status;
    }

    //––––––––––––––––––––
    // VIEWS
    //––––––––––––––––––––

    function getParticipants(uint256 potId) external view returns (address[] memory) {
        return pots[potId].participants;
    }

    function getRequests(uint256 potId) external view returns (PotRequest[] memory) {
        return requestedParticipants[potId];
    }

    function getCreatorFee(uint8 maxParticipants) public view returns (uint256) {
        uint256 slots = maxParticipants == 0 ? type(uint8).max : maxParticipants;
        return platformFee + participantFee * slots;
    }

    function getParticipantFee(uint8 maxParticipants) public view returns (uint256) {
        uint256 slots = maxParticipants == 0 ? type(uint8).max : maxParticipants;
        return participantFee * slots;
    }
}
