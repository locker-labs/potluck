import type { Address, Chain } from 'viem';
import { zeroAddress } from 'viem';
import { base, baseSepolia } from 'viem/chains';

if (!process.env.NEXT_PUBLIC_CHAIN_ID) {
  throw new Error('NEXT_PUBLIC_CHAIN_ID environment variable is not set');
}

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

if (isNaN(chainId)) {
  throw new Error(`Invalid chain ID: ${process.env.NEXT_PUBLIC_CHAIN_ID}`);
}

const chainIds = [8453, 84532]; // Base Mainnet and Base Sepolia

if (!chainIds.includes(chainId)) {
    throw new Error(
        `Unsupported chain ID: ${chainId}. Supported: ${chainIds.join(', ')}`
    );
}

type TChainId = typeof chainIds[number];

type TContractConfig = {
  chain: Chain;
  deploymentBlockBigInt: bigint;
  contractAddress: Address;
  tokenAddress: Address;
}

const chainIdToContractConfig : Record<TChainId, TContractConfig> = {
    8453: {
        chain: base,
        deploymentBlockBigInt: 0n, // Not deployed on mainnet yet
        contractAddress: zeroAddress,
        tokenAddress: zeroAddress,
    },
    84532: {
        chain: baseSepolia,
        deploymentBlockBigInt: 26625932n, // Deployment block for Base Sepolia
        contractAddress: '0x16d17ae0adf57782AA3CE8b8162be44300b8a0E8',
        tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    },
}

const chain: Chain = chainIdToContractConfig[chainId].chain;
const deploymentBlockBigInt: bigint = chainIdToContractConfig[chainId].deploymentBlockBigInt; // Block number where the contract was deployed
const contractAddress: Address = chainIdToContractConfig[chainId].contractAddress; // Address of the contract
const tokenAddress: Address = chainIdToContractConfig[chainId].tokenAddress; // Address of the token used in the contract

const PotCreatedEventSignature = 'event PotCreated(uint256 indexed potId, address indexed creator)';
const PotJoinedEventSignature =
  'event PotJoined(uint256 indexed potId, uint32 roundId, address indexed user)';
const PotPayoutEventSignature =
  'event PotPayout(uint256 indexed potId, address indexed winner, uint256 amount, uint32 round)';
const PotCreatedEventSignatureHash =
  '0xde307469e0906e8d7a6e84aec39b533cfe12dd01b2737a0f7855112613372317';
const PotJoinedEventSignatureHash =
  '0x672d3f5897f7a8042cd8c8557caf58ece26929a410c3b1a66a34ccfd3460fcde';

const abi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_platformFee', type: 'uint256', internalType: 'uint256' },
      { name: '_treasury', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'MAX_PARTICIPANTS',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createPot',
    inputs: [
      { name: 'name', type: 'bytes', internalType: 'bytes' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'entryAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'periodSeconds', type: 'uint256', internalType: 'uint256' },
      { name: 'participantsRoot', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getParticipants',
    inputs: [{ name: 'potId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasJoinedRound',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasWon',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'joinPot',
    inputs: [
      { name: 'potId', type: 'uint256', internalType: 'uint256' },
      { name: 'proof', type: 'bytes32[]', internalType: 'bytes32[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'platformFee',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'potCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pots',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256', internalType: 'uint256' },
      { name: 'name', type: 'bytes', internalType: 'bytes' },
      { name: 'round', type: 'uint32', internalType: 'uint32' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'balance', type: 'uint256', internalType: 'uint256' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'entryAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'period', type: 'uint256', internalType: 'uint256' },
      { name: 'totalParticipants', type: 'uint32', internalType: 'uint32' },
      { name: 'participantsRoot', type: 'bytes32', internalType: 'bytes32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setPlatformFee',
    inputs: [{ name: 'fee', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setTreasury',
    inputs: [{ name: 'newTreasury', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'treasury',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'triggerPotPayout',
    inputs: [{ name: 'potId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PotCreated',
    inputs: [
      { name: 'potId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PotJoined',
    inputs: [
      { name: 'potId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'roundId', type: 'uint32', indexed: false, internalType: 'uint32' },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PotPayout',
    inputs: [
      { name: 'potId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'winner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'round', type: 'uint32', indexed: false, internalType: 'uint32' },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'AlreadyJoined',
    inputs: [
      { name: 'potId', type: 'uint256', internalType: 'uint256' },
      { name: 'round', type: 'uint32', internalType: 'uint32' },
      { name: 'user', type: 'address', internalType: 'address' },
    ],
  },
  { type: 'error', name: 'EntryAmountZero', inputs: [] },
  {
    type: 'error',
    name: 'InsufficientFundsToRollover',
    inputs: [
      { name: 'total', type: 'uint256', internalType: 'uint256' },
      { name: 'rollover', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'InvalidParticipant',
    inputs: [
      { name: 'participant', type: 'address', internalType: 'address' },
      { name: 'potId', type: 'uint256', internalType: 'uint256' },
    ],
  },
  { type: 'error', name: 'NoEligibleParticipants', inputs: [] },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
  },
  { type: 'error', name: 'PeriodTooShort', inputs: [] },
  {
    type: 'error',
    name: 'PotDoesNotExist',
    inputs: [{ name: 'potId', type: 'uint256', internalType: 'uint256' }],
  },
  {
    type: 'error',
    name: 'PotFull',
    inputs: [{ name: 'maxParticipants', type: 'uint8', internalType: 'uint8' }],
  },
  {
    type: 'error',
    name: 'RoundEnded',
    inputs: [
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'nowTimestamp', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'RoundNotReady',
    inputs: [
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'nowTimestamp', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
  },
];

export {
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
};
