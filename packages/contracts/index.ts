console.log("Hello via Bun!");

export { default as PotluckArtifact } from './out/Potluck.sol/Potluck.json';
import { default as PotluckBaseSepolia} from './broadcast/DeployPotluck.s.sol/84532/run-latest.json';

export const PotluckAddressBaseSepolia = PotluckBaseSepolia.transactions[0]?.contractAddress;