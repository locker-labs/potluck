import type { Address, Chain } from 'viem';
import { zeroAddress } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import {
  type AppKitNetwork,
  baseSepolia as appKitBaseSepolia,
  base as appKitBase,
} from '@reown/appkit/networks';
import { PotluckArtifact, PotluckAddressBaseSepolia } from '@potluck/contracts';

if (!process.env.NEXT_PUBLIC_CHAIN_ID) {
  throw new Error('NEXT_PUBLIC_CHAIN_ID environment variable is not set');
}

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

if (Number.isNaN(chainId)) {
  throw new Error(`Invalid chain ID: ${process.env.NEXT_PUBLIC_CHAIN_ID}`);
}

const chainIds = [8453, 84532]; // Base Mainnet and Base Sepolia

if (!chainIds.includes(chainId)) {
  console.log(chainId);
  throw new Error(`Unsupported chain ID: ${chainId}. Supported: ${chainIds.join(', ')}`);
}

type TChainId = (typeof chainIds)[number];

type TContractConfig = {
  appKitNetwork: AppKitNetwork;
  chain: Chain;
  deploymentBlockBigInt: bigint;
  contractAddress: Address;
  tokenAddress: Address;
};

const chainIdToContractConfig: Record<TChainId, TContractConfig> = {
  8453: {
    appKitNetwork: appKitBase,
    chain: base,
    deploymentBlockBigInt: 0n, // Not deployed on mainnet yet
    contractAddress: zeroAddress,
    tokenAddress: zeroAddress,
  },
  84532: {
    appKitNetwork: appKitBaseSepolia,
    chain: baseSepolia,
    deploymentBlockBigInt: 26625932n, // Deployment block for Base Sepolia
    contractAddress: PotluckAddressBaseSepolia as Address,
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
};

const appKitNetwork: AppKitNetwork = chainIdToContractConfig[chainId].appKitNetwork;
const chain: Chain = chainIdToContractConfig[chainId].chain;
const deploymentBlockBigInt: bigint = chainIdToContractConfig[chainId].deploymentBlockBigInt;
const contractAddress: Address = chainIdToContractConfig[chainId].contractAddress;
const tokenAddress: Address = chainIdToContractConfig[chainId].tokenAddress;
const MAX_PARTICIPANTS = 2 ** 8 - 1; // max value for uint8

const PotCreatedEventSignature = 'event PotCreated(uint256 indexed potId, address indexed creator)';
const PotJoinedEventSignature =
  'event PotJoined(uint256 indexed potId, uint32 roundId, address indexed user)';
const PotPayoutEventSignature =
  'event PotPayout(uint256 indexed potId, address indexed winner, uint256 amount, uint32 round)';
const PotCreatedEventSignatureHash =
  '0xde307469e0906e8d7a6e84aec39b533cfe12dd01b2737a0f7855112613372317';
const PotJoinedEventSignatureHash =
  '0x672d3f5897f7a8042cd8c8557caf58ece26929a410c3b1a66a34ccfd3460fcde';

// Use the ABI from the contract artifact
const abi = PotluckArtifact.abi;

export {
  appKitNetwork,
  chainId,
  chain,
  deploymentBlockBigInt,
  contractAddress,
  tokenAddress,
  PotCreatedEventSignature,
  PotJoinedEventSignature,
  PotPayoutEventSignature,
  PotCreatedEventSignatureHash,
  PotJoinedEventSignatureHash,
  abi,
  MAX_PARTICIPANTS,
};
