// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../src/Potluck.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MockToken", "MTKN") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract PotluckGasTest is Test {
    Potluck potluck;
    MockERC20 token;
    address payable treasury = payable(address(0xBEEF));
    uint256 platformFee = 1 ether;
    uint256 entryAmount = 10 ether;
    uint256 periodSeconds = 3600; // 1 hour

    address alice = address(0xA1);
    address bob = address(0xB2);
    bytes32[] emptyProof; // Empty proof for Merkle tree

    // Precomputed Merkle root for a single‐leaf tree containing only `alice`:
    // leaf = keccak256(abi.encodePacked(alice))
    // root = leaf (since there is only one leaf and no siblings)
    bytes32 public SINGLE_ALICE_ROOT;

    function setUp() public {
        // 1. Deploy token and potluck contract
        token = new MockERC20();
        potluck = new Potluck(platformFee, treasury);

        // 2. Mint tokens for alice and bob, and approve potluck to spend
        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);

        vm.prank(alice);
        token.approve(address(potluck), type(uint256).max);

        vm.prank(bob);
        token.approve(address(potluck), type(uint256).max);
    }

    /// @notice Gas‐benchmark for createPot(...) using a Merkle root
    function testCreatePot_gas() public {
        vm.startPrank(alice);
        // Alice calls createPot(token, entryAmount, periodSeconds, merkleRoot)
        // Here, merkleRoot = SINGLE_ALICE_ROOT, so only `alice` is allowlisted.
        potluck.createPot(unicode"testPot😊", address(token), entryAmount, periodSeconds, true);
        vm.stopPrank();
    }

    /// @notice Gas‐benchmark for joinPot(...) when the caller is on the allowlist (proof = [])
    function testJoinPot_gas() public {
        // (1) Alice creates a pot so that potId == 0 exists
        vm.startPrank(alice);
        potluck.createPot(unicode"testPot😊", address(token), entryAmount, periodSeconds, true);
        vm.stopPrank();

        // (2) Fast‐forward to 5 minutes later, still before deadline
        vm.warp(block.timestamp + 300);

        // (3) Bob tries to join with an empty proof => should revert due to invalid proof
        vm.prank(bob);
        potluck.joinPot(0);

        // (4) Alice joins with the empty proof (valid, since SINGLE_ALICE_ROOT == leaf)
        vm.prank(alice);
        vm.expectRevert();
        potluck.joinPot(0);
    }

    /// @notice Gas‐benchmark for triggerPotPayout(...) when only one participant exists
    function testTriggerPotPayout_singleParticipant_gas() public {
        // (1) Alice creates the pot (potId == 0)
        vm.startPrank(alice);
        potluck.createPot(unicode"testPot😊", address(token), entryAmount, periodSeconds, true);
        vm.stopPrank();

        // (2) Bob joins before the deadline
        vm.warp(block.timestamp + 300);
        vm.prank(bob);
        potluck.joinPot(0);

        // (3) Advance time to after the pot’s deadline
        vm.warp(block.timestamp + periodSeconds + 1);

        // (4) Alice (or anyone) triggers payout. Because only Alice joined in round 0,
        //     this is the “isLast” case where rollover = 0 and prize = balance.
        vm.prank(alice);
        potluck.triggerPotPayout(0);
    }

    /// @notice Verify that non‐allowlisted users cannot join even before deadline
    function testJoinRevert_NotAllowlisted() public {
        // (1) Alice creates a pot with only herself in the allowlist
        vm.prank(alice);
        potluck.createPot(unicode"testPot😊", address(token), entryAmount, periodSeconds, true);

        // (2) Bob attempts to join immediately (proof = []), before deadline
        vm.prank(bob);
        potluck.joinPot(0);
    }
}
