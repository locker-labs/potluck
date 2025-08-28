console.log("Hello via Bun!");

export { default as PotluckArtifact } from './out/Potluck.sol/Potluck.json';
import { default as PotluckBaseSepolia } from './broadcast/DeployPotluck.s.sol/84532/run-latest.json';
import { default as PotluckBase } from "./broadcast/DeployPotluck.s.sol/8453/run-latest.json";

export const PotluckAddressBaseSepolia = PotluckBaseSepolia.transactions[0]?.contractAddress;
export const PotluckAddressBase = PotluckBase.transactions[0]?.contractAddress;

export { default as PotluckBatcherArtifact } from "./out/PotluckBatcher.sol/PotluckBatcher.json";
