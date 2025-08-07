// Dead code: This function is not used in the current codebase, but it can be useful as a fallback for future implementations.

import { abi, contractAddress } from '@/config';
import { publicClient } from '@/clients/viem';
import type { TPot, TPotObject } from '../types';
import { formatUnits, hexToString, type Address } from 'viem';
import { keccak256, encodePacked } from 'viem';

export const daySeconds = 86400; // 24 * 60 * 60
export const weekDays = 7;
export const monthDays = 30;

export const periodSecondsMap = {
  daily: BigInt(daySeconds),
  weekly: BigInt(daySeconds * weekDays),
  monthly: BigInt(daySeconds * monthDays),
};

function getPeriodInText(period: bigint): string {
  for (const [key, value] of Object.entries(periodSecondsMap)) {
    if (period === value) {
      return key;
    }
  }
  return 'unknown';
}

function getDeadlineString(deadline: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000)); // current UTC time in seconds as bigint
  const diff = deadline > now ? deadline - now : 0n;

  const seconds = diff;
  const minutes = seconds / 60n;
  const hours = minutes / 60n;
  const days = hours / 24n;
  const weeks = days / 7n;
  const months = days / 30n;

  if (seconds < 60n) return `${seconds}s`;
  if (minutes < 60n) return `${minutes}m`;
  if (hours < 24n) return `${hours}h`;
  if (days < 7n) return `${days}d`;
  if (days < 30n) return `${weeks}w`;
  return `${months}m`;
}

// Dead code
export function potMapper(pot: TPot, participants: Address[]): TPotObject {
  return {
    id: pot[0],
    creator: pot[1],
    name: hexToString(pot[2]), // Decoded from bytes
    round: pot[3], // uint32
    deadline: pot[4], // in seconds
    balance: pot[5],
    token: pot[6], // Ethereum address
    entryAmount: pot[7], // in wei
    entryAmountFormatted: formatUnits(pot[7], 6), // formatted to 6 decimal places
    period: pot[8], // in seconds
    totalParticipants: pot[9], // uint32
    maxParticipants: Number(pot[10]), // uint8
    isPublic: pot[11],
    participants: participants, // Array of Ethereum addresses
    // derived properties
    periodString: getPeriodInText(pot[8]),
    deadlineString: getDeadlineString(pot[4]),
    totalPool: formatUnits(BigInt(pot[9]) * pot[7], 6), // total pool = number of participants * entry amount
    nextDrawAt: new Date(Number(pot[4]) * 1000), // Convert seconds to milliseconds
    createdAt: new Date(),
  };
}

// Dead code
export async function fetchPot(potIdBigInt: bigint): Promise<TPot> {
  return (await publicClient.readContract({
    address: contractAddress,
    abi: abi,
    functionName: 'pots',
    args: [potIdBigInt],
  })) as TPot;
}

// Dead code
export async function getPotParticipants(potIdBigInt: bigint): Promise<Address[]> {
  return (await publicClient.readContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getParticipants',
    args: [potIdBigInt],
  })) as Address[];
}

// TODO: create a subgraph query to replace its usage
export async function getHasJoinedRound(
  potIdBigInt: bigint,
  round: number,
  address: Address,
): Promise<boolean> {
  return (await publicClient.readContract({
    address: contractAddress,
    abi: abi,
    functionName: 'hasJoinedRound',
    args: [
      keccak256(encodePacked(['uint256', 'uint32', 'address'], [potIdBigInt, round, address])),
    ],
  })) as boolean;
}

// TODO: create a subgraph query to replace its usage
export async function getPlatformFee(): Promise<bigint> {
  return (await publicClient.readContract({
    address: contractAddress,
    abi: abi,
    functionName: 'platformFee',
  })) as bigint;
}

// TODO: create a subgraph query to replace its usage
export async function getParticipantFee(): Promise<bigint> {
  return (await publicClient.readContract({
    address: contractAddress,
    abi: abi,
    functionName: 'participantFee',
  })) as bigint;
}
