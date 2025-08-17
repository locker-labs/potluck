// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/Potluck.sol";

contract ConfigurePotluck is Script {
    function run() external {
        // --- load from environment ---
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address potluckAddr = address(0x55d6eE3D0ebbB82D58E7437FC905Fc19229Be424);
        bytes32 keyHash = bytes32(0x9e1344a1247c8a1785d0a4681a27152bffdb43666ae5bf7d14d24a5efd44bf71);
        uint256 subscriptionId = 75130548142902775054364512190156145280145330302373548095325666767511337251427;
        uint16 requestConfirmations = 15;
        uint32 callbackGasLimit = 2400000;
        address token = address(0x036CbD53842c5426634e7929541eC2318f3dCF7e);

        // --- broadcast the transaction ---
        vm.startBroadcast(deployerKey);

        // Then set the other VRF parameters
        Potluck(potluckAddr).setChainlinkVRF(keyHash, subscriptionId, requestConfirmations, callbackGasLimit);

        console.log("=== Chainlink VRF Configuration Set ===");

        Potluck(potluckAddr).setTokenStatus(token, true);
        // Configue the contract in Chainlink subscription dashboard
        // --- end broadcast ---
        vm.stopBroadcast();
    }
}
