import type { Address } from 'viem';

export type TPotObject = {
  id: bigint;
  name: string; // Decoded from bytes
  round: number; // uint32
  deadline: bigint; // in seconds
  balance: bigint;
  token: Address; // Ethereum address
  entryAmount: bigint;
  period: bigint; // in seconds
  totalParticipants: number; // uint32
  maxParticipants: number; // uint8
  participants: Address[]; // Array of Ethereum addresses
  participantsRoot: Address; // bytes32
  // derived properties
  periodString: string; // e.g., "daily", "weekly", "biweekly", "monthly"
  deadlineString: string; // e.g., "5h", "2d", "1w"
  totalPool: string; // total pool = number of participants * entry amount
  creator: Address;
  nextDrawAt: Date;
  createdAt: Date;
};

export const mockPotObject: TPotObject = {
  id: 1n,
  name: '🎯 Pot Name',
  round: 1,
  deadline: 1n,
  balance: 1n,
  token: '0x1234567890abcdef1234567890abcdef12345678' as Address,
  entryAmount: 1n,
  period: 1n,
  totalParticipants: 1,
  maxParticipants: 10,
  participants: ['0x1234567890abcdef1234567890abcdef12345678'],
  participantsRoot: '0x1234567890abcdef1234567890abcdef12345678',
  periodString: 'daily',
  deadlineString: '5h',
  creator: '0x1234567890abcdef1234567890abcdef12345678',
  totalPool: '1',
  nextDrawAt: new Date(),
  createdAt: new Date(),
};

export type TPot = [
  bigint, // id
  Address, // name
  number, // round
  bigint, // deadline
  bigint, // balance
  Address, // token
  bigint, // entryAmount
  bigint, // period
  number, // totalParticipants
  number, // maxParticipants
  Address, // participants
  Address, // participantsRoot
];
