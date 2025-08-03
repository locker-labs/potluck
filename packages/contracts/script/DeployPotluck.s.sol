// script/DeployPotluck.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/Potluck.sol";

contract DeployPotluck is Script {
    function run() external {
        // load deployer key and config from env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury          = vm.envAddress("TREASURY_ADDRESS");
        address vrfCoordinator    = vm.envAddress("VRF_COORDINATOR");
        uint256 platformFee       = 500_000_000_000_000;       // 0.0005 ETH
        uint256 participantFee    = 1_200_000_000_000_000;    //  0.0012 ETH 

        vm.startBroadcast(deployerPrivateKey);

        // constructor: (uint256 _platformFee, uint256 _partFee, address _treasury, address _vrfCoordinator)
        Potluck potluck = new Potluck(
            platformFee,
            participantFee,
            treasury,
            vrfCoordinator
        );

        console.log("=== Deployment Info ===");
        console.log("Potluck deployed to: %s", address(potluck));
        console.log("Platform fee (wei):    %s", platformFee);
        console.log("Participant fee (wei): %s", participantFee);
        console.log("Treasury address:      %s", treasury);
        console.log("VRF Coordinator:       %s", vrfCoordinator);
        console.log("========================");

        vm.stopBroadcast();
    }
}
