// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/Potluck.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MockToken", "MTKN") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract PotluckGasTest is Test {

    Potluck         potluck;
    MockERC20       token;
    address payable treasury = payable(address(0xBEEF));
    uint256         platformFee = 1 ether;
    uint256         entryAmount = 10 ether;
    uint256         periodSeconds = 3600; // 1 hour

    address alice = address(0xA1);
    address bob   = address(0xB2);

    function setUp() public {
        token = new MockERC20();
        potluck = new Potluck(platformFee, treasury);

        token.mint(alice, 1000 ether);
        token.mint(bob,   1000 ether);

        vm.prank(alice);
        token.approve(address(potluck), type(uint256).max);

        vm.prank(bob);
        token.approve(address(potluck), type(uint256).max);
    }

    /// @notice Gas‐benchmark for createPot(...)
    function testCreatePot_gas() public {
        vm.startPrank(alice);
        // Alice calls createPot(token, entryAmount, periodSeconds, isPublic=true)
        potluck.createPot(address(token), entryAmount, periodSeconds, true);
        vm.stopPrank();
    }

    /// @notice Gas‐benchmark for joinPot(...) when round == 0
    function testJoinPot_gas() public {
        // First, Alice creates a pot so that potId=0 exists
        vm.startPrank(alice);
        potluck.createPot(address(token), entryAmount, periodSeconds, true);
        vm.stopPrank();

        // Now Bob calls joinPot(0) before the deadline
        vm.warp(block.timestamp + 300); // +5 minutes (still < deadline)
        vm.prank(bob);
        potluck.joinPot(0);
    }

    /// @notice Gas‐benchmark for triggerPotPayout(...) when only one participant exists
    function testTriggerPotPayout_singleParticipant_gas() public {
        // (1) Alice creates the pot (potId = 0)
        vm.startPrank(alice);
        potluck.createPot(address(token), entryAmount, periodSeconds, true);
        vm.stopPrank();

        // (2) Advance time to after the pot’s deadline
        vm.warp(block.timestamp + periodSeconds + 1);

        // (3) Alice (or anyone) triggers payout. Because only Alice had joined in round 0,
        //     this is the “isLast” case where rollover = 0 and prize = balance.
        vm.prank(alice);
        potluck.triggerPotPayout(0);
    }
}