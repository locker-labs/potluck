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
    Potluck potluck;
    MockERC20 token;

    uint256 public platformFee = 1 ether;
    uint256 public participantFee = 1 ether;
    address public treasury = address(0xBEEF);
    address public vrfCoordinator = address(this);

    uint256 public entryAmount = 10 ether;
    uint256 public periodSeconds = 3600; // 1 hour

    address public alice = address(0xA1);
    address public bob = address(0xB2);

    function setUp() public {
        token = new MockERC20();
        potluck = new Potluck(platformFee, participantFee, treasury, vrfCoordinator);

        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);

        vm.prank(alice);
        token.approve(address(potluck), type(uint256).max);

        vm.prank(bob);
        token.approve(address(potluck), type(uint256).max);
    }
}
