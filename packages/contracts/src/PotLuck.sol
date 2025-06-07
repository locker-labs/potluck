// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title Potluck
 * @notice A recurring pool of token contributions where one random participant wins each period.
 *         Creator configures entry amount, period, optional max participants, and public access.
 *         Platform collects a fixed fee on creation, sent to `treasury`.
 */
contract Potluck is Ownable {
    using MerkleProof for bytes32[];
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
    error InvalidParticipant(address participant, uint256 potId);

    //––––––––––––––––––––
    // STATE
    //––––––––––––––––––––

    uint8 public constant MAX_PARTICIPANTS = 100;
    uint256 public potCount;

    /// @notice Fixed fee (in token-units) to create a pot
    uint256 public platformFee;
    /// @notice Where all creation fees go
    address public treasury;

    struct Pot {
        uint256 id;
        bytes name;
        uint32 round;
        uint256 deadline;
        uint256 balance;
        address token;
        uint256 entryAmount;
        uint256 period;
        uint32 totalParticipants;
        address[] participants;
        bytes32 participantsRoot;
    }

    mapping(uint256 => Pot) public pots;
    mapping(bytes32 => bool) public hasJoinedRound; // keccak(pot,round,user)
    mapping(bytes32 => bool) public hasWon; // keccak(pot,user)

    event PotCreated(uint256 indexed potId, address indexed creator);
    event PotJoined(uint256 indexed potId, uint32 roundId, address indexed user);
    event PotPayout(uint256 indexed potId, address indexed winner, uint256 amount, uint32 round);

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
        uint256 periodSeconds,
        bytes32 participantsRoot
    ) external {
        if (entryAmount == 0) revert EntryAmountZero();
        if (periodSeconds < 1 hours) revert PeriodTooShort();

        // 1) Collect the fixed fee to treasury
        IERC20(token).safeTransferFrom(msg.sender, treasury, platformFee);

        // 2) Collect the stake for the pot
        IERC20(token).safeTransferFrom(msg.sender, address(this), entryAmount);

        // 3) Initialize the pot
        uint256 potId = potCount++;
        Pot storage p = pots[potId];
        p.id = potId;
        p.name = name;
        p.token = token;
        p.entryAmount = entryAmount;
        p.period = periodSeconds;
        p.participantsRoot = participantsRoot;
        p.totalParticipants = 1;
        p.deadline = block.timestamp + periodSeconds;
        p.balance = entryAmount;
        p.participants.push(msg.sender);

        // mark joined in round 0
        hasJoinedRound[keccak256(abi.encodePacked(potId, uint32(0), msg.sender))] = true;

        emit PotCreated(potId, msg.sender);
        emit PotJoined(potId, 0, msg.sender);
    }

    //––––––––––––––––––––
    // JOIN
    //––––––––––––––––––––
    function joinPot(uint256 potId, bytes32[] calldata proof) external {
        Pot storage p = pots[potId];
        if (p.balance == 0) revert PotDoesNotExist(potId);
        if (block.timestamp >= p.deadline) revert RoundEnded(p.deadline, block.timestamp);
        if (p.participants.length >= MAX_PARTICIPANTS) {
            revert PotFull(MAX_PARTICIPANTS);
        }
        if (!hasJoinedRound[keccak256(abi.encodePacked(potId, uint32(0), msg.sender))] && p.round > 0) {
            revert InvalidParticipant(msg.sender, potId);
        }
        bytes32 root = p.participantsRoot;
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        if (root != bytes32(0) && !proof.verify(root, leaf)) {
            revert InvalidParticipant(msg.sender, potId);
        }

        bytes32 key = keccak256(abi.encodePacked(potId, p.round, msg.sender));
        if (hasJoinedRound[key]) revert AlreadyJoined(potId, p.round, msg.sender);

        // only bump totalParticipants in the first round
        if (p.round == 0) {
            p.totalParticipants++;
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
    function triggerPotPayout(uint256 potId) external {
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
        IERC20(p.token).safeTransfer(winner, prize);

        uint32 nextRound = ++p.round;
        emit PotPayout(potId, winner, prize, nextRound - 1);

        if (isLast) {
            // pot complete
            p.balance = 0;

            delete p.participants;
            return;
        }

        // roll over one entry
        p.balance = rollover;
        delete p.participants;

        // auto-reenter the winner
        p.participants.push(winner);
        hasJoinedRound[keccak256(abi.encodePacked(potId, nextRound, winner))] = true;
        emit PotJoined(potId, nextRound, winner);

        p.deadline = block.timestamp + p.period;
    }

    //––––––––––––––––––––
    // OWNER ACTIONS
    //––––––––––––––––––––

    function setPlatformFee(uint256 fee) external onlyOwner {
        platformFee = fee;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
    }

    //––––––––––––––––––––
    // VIEWS
    //––––––––––––––––––––

    function getParticipants(uint256 potId) external view returns (address[] memory) {
        return pots[potId].participants;
    }
}
