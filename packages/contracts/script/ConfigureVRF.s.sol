// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/Potluck.sol";

contract ConfigureChainlink is Script {
    function run() external {
        // --- load from environment ---
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address potluckAddr = address(0x712f260ee23C69Fc9C548c5c807B087d1C91DfE3);
        bytes32 keyHash = bytes32(0x9e1344a1247c8a1785d0a4681a27152bffdb43666ae5bf7d14d24a5efd44bf71);
        uint256 subscriptionId = 75130548142902775054364512190156145280145330302373548095325666767511337251427;
        uint16 requestConfirmations = 15;
        uint32 callbackGasLimit = 2400000;

        // --- broadcast the transaction ---
        vm.startBroadcast(deployerKey);

        // Then set the other VRF parameters
        Potluck(potluckAddr).setChainlinkVRF(keyHash, subscriptionId, requestConfirmations, callbackGasLimit);

        console.log("=== Chainlink VRF Configuration Set ===");

        // Configue the contract in Chainlink subscription dashboard
        // --- end broadcast ---
        vm.stopBroadcast();
    }
}
