// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Potluck.sol";

contract PotluckBatcher {
    Potluck immutable potluck;
    constructor(address _potluck) {
        potluck = Potluck(_potluck);
    }
    function batchTriggerPayout(uint256[] memory potIds) public {
        for (uint256 i = 0; i < potIds.length; i++) {
            potluck.triggerPotPayout(potIds[i]);
        }
    }

    function endBatch(uint256[] calldata potIds) external {
        for (uint256 i = 0; i < potIds.length; i++) {
            potluck.endPot(potIds[i]);
        }
    }

    function triggerBatchJoinOnBehalf(uint256 potId, address[] calldata participants) external {
        for (uint256 i = 0; i < participants.length; i++) {
            potluck.joinOnBehalf(potId, participants[i]);
        }
    }
}