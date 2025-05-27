// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PotLuck
 * @notice A recurring pool of USDC contributions where one random participant wins the pot each period.
 *         Creator configures entry amount, period, optional max participants, and public access.
 *         Platform collects a fee percentage on each payout.
 */
contract PotLuck is Ownable {
    using SafeERC20 for IERC20;

    uint8 constant MAX_PARTICIPANTS = 100; // Max participants per pot

    uint256 public potCount;
    uint256 public platformFeePct; // e.g., 10 for 10%

    struct Pot {
        uint256    id;
        uint32     round;         // current round number
        uint256     deadline;      // timestamp when round ends
        uint256    balance;      // total balance in pot
        address    token;
        uint256    entryAmount;
        uint256    period;          // in seconds
        bool       isPublic;
        uint32     totalParticipants;
        address[]  participants;   // list of participants in current round
    }

    mapping(uint256 => Pot) public pots;
    mapping(bytes32 => bool) public hasJoinedRound; // keccak256(potId,roundId,user) -> bool;
    mapping(bytes32 => bool) public hasWon; // keccak256(potId,user) -> bool;

    event PotCreated(uint256 indexed potId, address indexed creator);
    event Joined(uint256 indexed potId, uint32 roundId,address indexed user);
    event Payout(uint256 indexed potId, address indexed winner, uint256 amount, uint32 round);

    constructor(uint256 _platformFeePct) Ownable(msg.sender) {
        require(_platformFeePct <= 100, "Fee pct <= 100");
        platformFeePct = _platformFeePct;
    }

    /**
     * @notice Create a new public pot with specified parameters.
     * @param token Address of the ERC20 token contract.
     * @param entryAmount USDC amount each participant must contribute.
     * @param periodSeconds Duration of each round in seconds.
     */
    function createPotLuck(
        address token,
        uint256 entryAmount,
        uint256 periodSeconds
    ) external {
        require(entryAmount > 0, "Entry > 0");
        require(periodSeconds >= 1 hours, "Period must be >=1h");

        uint256 currentPotCount = potCount++;
        Pot storage p = pots[currentPotCount];
        p.id = currentPotCount;
        p.token = token;
        p.entryAmount = entryAmount;
        p.period = periodSeconds;
        p.isPublic = true;
        p.totalParticipants = 1;
        p.deadline = block.timestamp + periodSeconds;
        p.participants.push(msg.sender);

        IERC20(token).safeTransferFrom(msg.sender, address(this), entryAmount);
        p.balance = entryAmount;

        bytes32 joinKey = keccak256(abi.encodePacked(currentPotCount, uint32(0), msg.sender));
        hasJoinedRound[joinKey] = true;

        emit PotCreated(currentPotCount, msg.sender);
        emit Joined(currentPotCount, 0,msg.sender);
    }

    /**
     * @notice Join an existing pot by depositing entry amount.
     * @param potId Identifier of the pot.
     */
    function joinPot(uint256 potId) external {
        Pot storage p = pots[potId];
        require(p.balance > 0, "Pot not exist");
        require(block.timestamp < p.deadline, "Round ended");
        require(p.totalParticipants < MAX_PARTICIPANTS, "Full");
        bytes32 joinKey = keccak256(abi.encodePacked(potId, p.round, msg.sender));
        require(!hasJoinedRound[joinKey], "Already joined this round");

        if(p.round ==0){
            p.totalParticipants++; 
        }


        IERC20(p.token).safeTransferFrom(msg.sender, address(this), p.entryAmount);
        p.balance += p.entryAmount;
        p.participants.push(msg.sender);
        
        hasJoinedRound[joinKey] = true;

        emit Joined(potId,p.round, msg.sender);
    }

    /**
     * @notice Trigger payout for pot after deadline; picks a random winner, sends pot minus fee.
     *         Resets round for next period.
     * @param potId Identifier of the pot.
     */
    function triggerPayout(uint256 potId) external {
        Pot storage p = pots[potId];
    require(p.balance > 0,                "Pot not exist");
    require(block.timestamp >= p.deadline, "Round in progress");

    // Detect “last round”: we’ve already done totalParticipants−1 rounds (0-indexed)
   bool isLast = (p.round == p.totalParticipants - 1);

   // If NOT last round, we keep one entryAmount as rollover
    uint256 rollover = isLast ? 0 : p.entryAmount;
    uint256 total    = p.balance;
    uint256 fee      = (total * platformFeePct) / 100;
    require(total >= fee + rollover, "Insufficient funds to rollover");

    uint256 prize = total - fee - rollover;

    bytes32 seed = keccak256(
        abi.encodePacked(
            blockhash(block.number - 1),
            potId,
            p.round,
            total
        )
    );

    // 2) pick a start index in [0..len)
    uint256 len = p.participants.length;
    uint256 idx = uint256(seed) % len;

    // 3) scan forward until we find someone !hasWon
    address winner;
    for (uint256 i = 0; i < len; i++) {
        address candidate = p.participants[(idx + i) % len];
        bytes32 candidateKey = keccak256(abi.encodePacked(potId, candidate));

        if (!hasWon[candidateKey]) {
            winner = candidate;
            break;
        }
    }

    require(winner != address(0), "No eligible participants");

    bytes32 winnerKey = keccak256(abi.encodePacked(potId, winner));
    hasWon[winnerKey] = true;


    IERC20(p.token).safeTransfer(winner, prize);
    if (fee > 0) {
        IERC20(p.token).safeTransfer(owner(), fee);
    }

    uint32 nextRound = ++p.round;

    emit Payout(potId, winner, prize, nextRound - 1);
    if (isLast) {
       // --- FINAL ROUND: no more rollover, end the pot ---
       p.balance = 0;
       delete p.participants;
       p.isPublic = false;
       return;
   }

    p.balance = rollover;
    delete p.participants;

    // auto-re-enter winner into new round
    p.participants.push(winner);
    bytes32 nextKey = keccak256(abi.encodePacked(potId, nextRound, winner));
    hasJoinedRound[nextKey] = true;
    emit Joined(potId, nextRound, winner);

    p.deadline = block.timestamp + p.period;
    }

    /** @notice Allows owner to update platform fee percentage (<=100). */
    function setPlatformFeePct(uint256 pct) external onlyOwner {
        require(pct <= 100, "Fee pct <= 100");
        platformFeePct = pct;
    }

    /** @notice View current participants of a pot. */
    function getParticipants(uint256 potId) external view returns (address[] memory) {
        return pots[potId].participants;
    }
}
