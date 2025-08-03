// test/PotluckGasTest.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Potluck} from "../src/Potluck.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MockToken", "MTKN") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract PotluckGasTest is Test {
    Potluck   potluck;
    MockERC20 token;

    uint256 public platformFee    = 1 ether;
    uint256 public participantFee = 1 ether;
    address public treasury       = address(0xBEEF);
    address public vrfCoordinator = address(this);

    uint256 public entryAmount   = 10 ether;
    uint256 public periodSeconds = 3600; // 1 hour

    address public alice = address(0xA1);
    address public bob   = address(0xB2);

    function setUp() public {
        token   = new MockERC20();
        potluck = new Potluck(platformFee, participantFee, treasury, vrfCoordinator);

        token.mint(alice, 1000 ether);
        token.mint(bob,   1000 ether);

        vm.prank(alice);
        token.approve(address(potluck), type(uint256).max);

        vm.prank(bob);
        token.approve(address(potluck), type(uint256).max);
    }

    /// @notice Gas‐benchmark for createPot(...)
    function testCreatePot_gas() public {
        uint8 slots    = 2;
        uint256 required = potluck.getRequiredFee(slots);

        vm.prank(alice);
        potluck.createPot{value: required}(
            unicode"testPot😊",
            address(token),
            entryAmount,
            slots,         // maxParticipants
            periodSeconds,
            true           // public pot
        );
    }

    /// @notice Gas‐benchmark for joinPot(...) in a public pot
    function testJoinPot_gas() public {
        uint8 slots    = 2;
        uint256 required = potluck.getRequiredFee(slots);

        // (1) Create the pot
        vm.prank(alice);
        potluck.createPot{value: required}(
            unicode"testPot😊",
            address(token),
            entryAmount,
            slots,
            periodSeconds,
            true
        );

        // (2) Advance time
        vm.warp(block.timestamp + 300);

        // (3) Bob joins
        vm.prank(bob);
        potluck.joinPot(0);
    }

    /// @notice Verify that non‐allowlisted users cannot join a private pot
    function testJoinRevert_NotAllowlisted() public {
        uint8 slots    = 2;
        uint256 required = potluck.getRequiredFee(slots);

        // (1) Create private pot
        vm.prank(alice);
        potluck.createPot{value: required}(
            unicode"testPot😊",
            address(token),
            entryAmount,
            slots,
            periodSeconds,
            false // private
        );

        // (2) Bob (not allowed) must revert
        vm.prank(bob);
        vm.expectRevert(); 
        potluck.joinPot(0);
    }

    /// @notice Measure gas cost of a reverted joinOnBehalf(...)
    function testJoinOnBehalfRevert_gas() public {
        uint256 gasBefore = gasleft();
        vm.prank(alice);
        try potluck.joinOnBehalf(0, bob) {
            // should never succeed
        } catch {
            // ignore revert
        }
        uint256 gasUsed = gasBefore - gasleft();
        console.log("joinOnBehalf revert gas:", gasUsed);
    }
}
