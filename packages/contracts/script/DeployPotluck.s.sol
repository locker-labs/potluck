// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/Potluck.sol";

contract DeployPotluck is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy with initial platform fee of 0.01 USDC (6 decimals)
        uint256 platformFee = 10_000; // 0.01 USDC (6 decimals)
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        
        Potluck potluck = new Potluck(platformFee, treasury);

        console.log("=== Deployment Info ===");
        console.log("Network: %s", vm.envString("NETWORK"));
        console.log("Potluck deployed to: %s", address(potluck));
        console.log("Platform fee: 0.01 USDC");
        console.log("Treasury address: %s", treasury);
        console.log("=====================");

        vm.stopBroadcast();
    }
} 