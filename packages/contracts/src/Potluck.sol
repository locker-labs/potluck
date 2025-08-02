// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Potluck
 * @notice A recurring pool of token contributions where one random participant wins each period.
 *         Creator configures entry amount, period, optional max participants, and public access.
 *         Platform collects a fixed fee on creation, sent to `treasury`.
 */
contract Potluck is Ownable {
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
    error NoEligibleParticipants();
    error NotPotCreator(address sender, uint256 potId);
    error NotAllowed(address user, uint256 potId);
    error NotAllParticipantsWon(uint256 potId);

    //––––––––––––––––––––
    // STATE
    //––––––––––––––––––––
    uint256 public potCount;

    /// @notice Fixed fee (in token-units) to create a pot
    uint256 public platformFee;
    /// @notice Where all creation fees go
    address public treasury;

    enum RequestStatus {
        Active,
        Completed,
        Cancelled
    }

    struct PotRequest {
        address requestor;
        uint256 timestamp;
        RequestStatus status;
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
        uint32 totalParticipants;
        uint8 maxParticipants;
        address[] participants;
        bool isPublic;
    }

    mapping(uint256 => Pot) public pots;
    mapping(bytes32 => bool) public hasJoinedRound; // keccak(pot,round,user)
    mapping(bytes32 => bool) public hasWon; // keccak(pot,user)

    // Simple allow-list: potId => participant => allowed
    mapping(uint256 => mapping(address => bool)) public isAllowed;
    mapping(uint256 => PotRequest[]) public requestedParticipants;

    event PotCreated(uint256 indexed potId, address indexed creator);
    event PotJoined(uint256 indexed potId, uint32 roundId, address indexed user);
    event PotPayout(uint256 indexed potId, address indexed winner, uint256 amount, uint32 round);
    event PotAllowRequested(uint256 indexed potId, address indexed requestor);
    event AllowedParticipantAdded(uint256 indexed potId, address indexed user);
    event PotEnded(uint256 indexed potId);

    //––––––––––––––––––––
    // CONSTRUCTOR
    //––––––––––––––––––––

    constructor(uint256 _platformFee, address _treasury) Ownable(msg.sender) {
        platformFee = _platformFee;
        treasury = _treasury;
    }

    //––––––––––––––––––––
    // CREATE
    //––––––––––––––––––––

    function createPot(
        bytes memory name,
        address token,
        uint256 entryAmount,
        uint8 maxParticipants,
        uint256 periodSeconds,
        bool isPublic
    ) external {
        if (entryAmount == 0) revert EntryAmountZero();
        if (periodSeconds < 1 hours) revert PeriodTooShort();

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

        //  Collect the fixed fee to treasury
        IERC20(token).safeTransferFrom(msg.sender, treasury, platformFee);
        //  Collect the stake for the pot
        IERC20(token).safeTransferFrom(msg.sender, address(this), entryAmount);

        emit PotCreated(potId, msg.sender);
        emit PotJoined(potId, 0, msg.sender);
    }

    //––––––––––––––––––––
    // ALLOW MANAGEMENT
    //––––––––––––––––––––

    /// @notice Pot creator can add allowed participants
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

    function requestPotAllow(uint256 potId) external {
        requestedParticipants[potId].push(
            PotRequest({requestor: msg.sender, timestamp: block.timestamp, status: RequestStatus.Active})
        );
        emit PotAllowRequested(potId, msg.sender);
    }

    //––––––––––––––––––––
    // JOIN
    //––––––––––––––––––––

    function joinPot(uint256 potId) external {
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

    //––––––––––––––––––––
    // PAYOUT
    //––––––––––––––––––––

    function triggerPotPayout(uint256 potId) public {
        Pot storage p = pots[potId];
        if (p.balance == 0) revert PotDoesNotExist(potId);
        if (block.timestamp < p.deadline) revert RoundNotReady(p.deadline, block.timestamp);
        bool isLast = (p.round == p.totalParticipants - 1);
        uint256 rollover = isLast ? 0 : p.entryAmount;
        uint256 total = p.balance;
        if (total < rollover) revert InsufficientFundsToRollover(total, rollover);

        uint256 prize = total - rollover;

        // pseudo-random seed
        bytes32 seed = keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1), potId, p.round, total));

        uint256 len = p.participants.length;
        uint256 idx = uint256(seed) % len;

        // find a non-winner
        address winner;
        for (uint256 i = 0; i < len; i++) {
            address cand = p.participants[(idx + i) % len];
            if (!hasWon[keccak256(abi.encodePacked(potId, cand))]) {
                winner = cand;
                break;
            }
        }
        if (winner == address(0)) revert NoEligibleParticipants();

        hasWon[keccak256(abi.encodePacked(potId, winner))] = true;

        uint32 nextRound = ++p.round;
        emit PotPayout(potId, winner, prize, nextRound - 1);

        if (isLast) {
            // pot complete
            p.balance = 0;
        } else {
            p.balance = rollover;
            delete p.participants;

            // auto-reenter the winner
            p.participants.push(winner);
            hasJoinedRound[keccak256(abi.encodePacked(potId, nextRound, winner))] = true;
            emit PotJoined(potId, nextRound, winner);

            p.deadline = block.timestamp + p.period;
        }
        IERC20(p.token).safeTransfer(winner, prize);
    }

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
            IERC20(token).safeTransfer(p.participants[i], entryAmount);
        }
        emit PotEnded(potId);
    }

    function joinOnBehalf(uint256 potId, address participant) public {
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

    function triggerBatchPayout(uint256[] calldata potIds) external {
        for (uint256 i = 0; i < potIds.length; i++) {
            triggerPotPayout(potIds[i]);
        }
    }

    function endBatch(uint256[] calldata potIds) external {
        for (uint256 i = 0; i < potIds.length; i++) {
            endPot(potIds[i]);
        }
    }

    function triggerBatchJoinOnBehalf(uint256 potId, address[] calldata participants) external {
        for (uint256 i = 0; i < participants.length; i++) {
            joinOnBehalf(potId, participants[i]);
        }
    }

    //––––––––––––––––––––
    // OWNER ACTIONS
    //––––––––––––––––––––

    function setPlatformFee(uint256 fee) external onlyOwner {
        platformFee = fee;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
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
}
