import { abi, contractAddress } from '@/config';
import { publicClient } from '@/clients/viem';
import type { TPot, TPotObject } from '../types';
import { pad, formatUnits, hexToString, type Address } from 'viem';

const periodSecondsMap = {
  daily: BigInt(86400),
  weekly: BigInt(604800),
  biweekly: BigInt(1209600),
  monthly: BigInt(2592000),
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

export function potMapper(pot: TPot, creator: Address, activeParticipants: Address[]): TPotObject {
  return {
    id: pot[0],
    name: hexToString(pot[1]), // Decoded from bytes
    round: pot[2], // uint32
    deadline: pot[3], // in seconds
    balance: pot[4],
    token: pot[5], // Ethereum address
    entryAmount: pot[6], // in wei
    period: pot[7], // in seconds
    totalParticipants: pot[8], // uint32
    // TODO: parse participants from bytes32
    participants: [pot[9]], // Array of Ethereum addresses
    participantsRoot: pot[10], // bytes32
    // derived properties
    activeParticipants: activeParticipants,
    periodString: getPeriodInText(pot[7]),
    deadlineString: getDeadlineString(pot[3]),
    totalPool: formatUnits(BigInt(pot[8]) * pot[6], 6), // total pool = number of participants * entry amount
    creator: creator,
    nextDrawAt: new Date(Number(pot[3]) * 1000), // Convert seconds to milliseconds
    createdAt: new Date(),
  };
}

export async function fetchPot(potIdBigInt: bigint): Promise<TPot> {
  return (await publicClient.readContract({
    address: contractAddress,
    abi: abi,
    functionName: 'pots',
    args: [potIdBigInt],
  })) as TPot;
}

export async function getPotParticipants(potIdBigInt: bigint): Promise<Address[]> {
  return (await publicClient.readContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getParticipants',
    args: [potIdBigInt],
  })) as Address[];
}

export const emptyBytes32 = pad('0x', { size: 32 });
