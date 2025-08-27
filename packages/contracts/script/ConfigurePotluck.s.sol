// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/Potluck.sol";

contract ConfigurePotluck is Script {
    function run() external {
        // --- load from environment ---
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address potluckAddr = address(0x4fC969fb322bd88FEa87921E57061Fde59275e5b);
        bytes32 keyHash = bytes32(0x00b81b5a830cb0a4009fbd8904de511e28631e62ce5ad231373d3cdad373ccab);
        uint256 subscriptionId = 21290774471208537793197677104438218974476603570290724017246559558022367675451;
        uint16 requestConfirmations = 15;
        uint32 callbackGasLimit = 2400000;
        address token = address(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);

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
