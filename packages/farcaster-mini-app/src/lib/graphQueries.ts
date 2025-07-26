// graphQueries.ts
import { GraphQLClient, gql } from "graphql-request";
import type { TPotObject } from "./types";
import { type Address, hexToString, formatUnits } from "viem";
import { publicClient } from "@/clients/viem";

const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/112614/potluck-subgraph/version/latest";
const client = new GraphQLClient(SUBGRAPH_URL);

const GET_ALL_POTS = gql`
  query GetAllPots($first: Int!, $skip: Int!) {
    pots(first: $first, skip: $skip, orderBy: createdAt, orderDirection: desc) {
      id
      name
      creator {
        id
      }
      tokenAddress
      entryAmount
      period
      maxParticipants
      isPublic
      currentRound
      currentDeadline
      currentBalance
      totalParticipants
      createdAt
      participants {
        user {
          id
        }
      }
    }
  }
`;

const GET_POT_FULL = gql`
  query GetPotFull($potId: ID!, $userAddress: ID!) {
    pot(id: $potId) {
      id
      name
      creator {
        id
      }
      tokenAddress
      entryAmount
      period
      maxParticipants
      isPublic
      currentRound
      currentDeadline
      currentBalance
      totalParticipants
      createdAt
      participants {
        user {
          id
        }
      }
    }
    contributions(
      where: { pot: $potId }
      orderBy: timestamp
      orderDirection: asc
    ) {
      round {
        roundNumber
      }
      user {
        id
      }
      amount
      timestamp
      transactionHash
      participantIndex
    }
    payouts(where: { pot: $potId }, orderBy: timestamp, orderDirection: asc) {
      round {
        roundNumber
      }
      winner {
        id
      }
      amount
      timestamp
      transactionHash
    }
    allowRequests(where: { pot: $potId, user: $userAddress }) {
      id
    }
    allowedUsers(where: { pot: $potId, user: $userAddress }) {
      id
    }
  }
`;

const GET_POTS_BY_CREATOR = gql`
  query GetPotsByCreator($creator: ID!) {
    pots(
      where: { creator: $creator }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      name
      creator {
        id
      }
      tokenAddress
      entryAmount
      period
      maxParticipants
      isPublic
      currentRound
      currentDeadline
      currentBalance
      totalParticipants
      createdAt
      participants {
        user {
          id
        }
      }
    }
  }
`;

// ——————————————————————————————————————————————————————————————
// Raw types
// ——————————————————————————————————————————————————————————————

type RawPot = {
  id: string;
  name: string;
  creator: { id: Address };
  tokenAddress: Address;
  entryAmount: string;
  period: string;
  maxParticipants: string;
  isPublic: boolean;
  currentRound: string;
  currentDeadline: string;
  currentBalance: string;
  totalParticipants: string;
  createdAt: string;
  participants: { user: { id: Address } }[];
};

type RawJoin = {
  round: { roundNumber: string };
  user: { id: Address };
  amount: string;
  timestamp: string;
  transactionHash: string;
  participantIndex: string;
};

type RawPayout = {
  round: { roundNumber: string };
  winner: { id: Address };
  amount: string;
  timestamp: string;
  transactionHash: string;
};

type PotFullResponse = {
  pot: RawPot;
  contributions: RawJoin[];
  payouts: RawPayout[];
  allowRequests: { id: string }[];
  allowedUsers: { id: string }[];
};

// ——————————————————————————————————————————————————————————————
// LogEntry type
// ——————————————————————————————————————————————————————————————

export interface LogEntry {
  type: "created" | "joined" | "payout";
  timestamp: bigint;
  data: {
    potId: bigint;
    creator?: Address;
    user?: Address;
    amount?: string;
    round?: number;
    txHash?: string;
    participantIndex?: number;
    winner?: Address;
  };
}

// ——————————————————————————————————————————————————————————————
// Helpers: name decoding, decimals, period/deadline formatting
// ——————————————————————————————————————————————————————————————

const td = new TextDecoder();
const decimalsCache = new Map<Address, number>();

function decodePotName(raw: string): string {
  if (/^0x[0-9a-fA-F]{64}$/.test(raw)) {
    return hexToString(raw as `0x${string}`, { size: 32 }).replace(/\0+$/, "");
  }
  const bytes = Uint8Array.from(raw, (ch) => ch.charCodeAt(0));
  return td.decode(bytes).replace(/\0+$/, "");
}

async function getDecimals(token: Address): Promise<number> {
  if (decimalsCache.has(token)) {
    return decimalsCache.get(token) as number;
  }
  const dec = await publicClient.readContract({
    address: token,
    abi: [
      {
        name: "decimals",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint8" }],
      },
    ],
    functionName: "decimals",
  });
  decimalsCache.set(token, dec as number);
  return dec as number;
}

// ——————————————————————————————————————————————————————————————
// COMMON MAPPER: RawPot → TPotObject
// ——————————————————————————————————————————————————————————————

async function mapRawPotToObject(rp: RawPot): Promise<TPotObject> {
  const period = BigInt(rp.period);
  const deadline = BigInt(rp.currentDeadline);
  const createdAt = BigInt(rp.createdAt);
  const entryAmount = BigInt(rp.entryAmount);
  const balance = BigInt(rp.currentBalance);
  const dec: number = await getDecimals(rp.tokenAddress);

  const participants = rp.participants.map((x) => x.user.id);
  const totalParticipants = participants.length;
  const totalPool: string = formatUnits(entryAmount * BigInt(totalParticipants), dec);

  const hrs = Number(period / 3600n);
  const periodString =
    period === 86400n
      ? "daily"
      : period === 604800n
      ? "weekly"
      : period === 2592000n
      ? "monthly"
      : hrs >= 24
      ? `${Math.round(hrs / 24)}d`
      : `${hrs}h`;

  const nowSec = Math.floor(Date.now() / 1000);
  const secsLeft = Number(deadline) - nowSec;
  const deadlineString =
    secsLeft <= 0
      ? "0s"
      : secsLeft < 60
      ? `${secsLeft}s`
      : secsLeft < 3600
      ? `${Math.floor(secsLeft / 60)}m`
      : secsLeft < 86400
      ? `${Math.floor(secsLeft / 3600)}h`
      : `${Math.floor(secsLeft / 86400)}d`;

  return {
    id: BigInt(rp.id),
    name: decodePotName(rp.name),
    round: Number(rp.currentRound),
    deadline,
    balance,
    token: rp.tokenAddress,
    entryAmount,
    entryAmountFormatted: formatUnits(entryAmount, dec),
    period,
    totalParticipants,
    maxParticipants: Number(rp.maxParticipants),
    participants,
    isPublic: rp.isPublic,

    periodString,
    deadlineString,
    totalPool,
    creator: rp.creator.id,
    nextDrawAt: new Date(Number(deadline) * 1000),
    createdAt: new Date(Number(createdAt) * 1000),
  };
}

export async function getAllPotObjects(
  first = 1000,
  skip = 0
): Promise<TPotObject[]> {
  const { pots } = await client.request<{ pots: RawPot[] }>(GET_ALL_POTS, {
    first,
    skip,
  });

  const tokens = Array.from(new Set(pots.map((p) => p.tokenAddress)));
  await Promise.all(tokens.map((t) => getDecimals(t)));

  return Promise.all(pots.map(mapRawPotToObject));
}


export async function fetchPotFull(
  potId: bigint,
  userAddress: Address
): Promise<{
  pot: TPotObject;
  logs: LogEntry[];
  hasRequested: boolean;
  isAllowed: boolean;
}> {
  const vars = {
    potId: potId.toString(),
    userAddress: userAddress.toLowerCase(),
  };
  const {
    pot: rp,
    contributions,
    payouts,
    allowRequests,
    allowedUsers,
  } = await client.request<PotFullResponse>(GET_POT_FULL, vars);

  const pot = await mapRawPotToObject(rp);
  const dec = await getDecimals(rp.tokenAddress);

  const logs: LogEntry[] = [];

  // created
  logs.push({
    type: "created",
    timestamp: BigInt(rp.createdAt),
    data: { potId, creator: rp.creator.id },
  });

  // joined (formatted amount)
  contributions.forEach((c) =>
    logs.push({
      type: "joined",
      timestamp: BigInt(c.timestamp),
      data: {
        potId,
        user: c.user.id,
        amount: formatUnits(BigInt(c.amount), dec),
        round: Number(c.round.roundNumber),
        txHash: c.transactionHash,
        participantIndex: Number(c.participantIndex),
      },
    })
  );

  // payout (formatted amount)
  payouts.forEach((p) =>
    logs.push({
      type: "payout",
      timestamp: BigInt(p.timestamp),
      data: {
        potId,
        winner: p.winner.id,
        amount: formatUnits(BigInt(p.amount), dec),
        round: Number(p.round.roundNumber),
        txHash: p.transactionHash,
      },
    })
  );

  logs.sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0
  );

  return {
    pot,
    logs,
    hasRequested: allowRequests.length > 0,
    isAllowed: allowedUsers.length > 0,
  };
}

export async function getPotsByCreator(
  creator: Address
): Promise<TPotObject[]> {
  const { pots } = await client.request<{ pots: RawPot[] }>(
    GET_POTS_BY_CREATOR,
    { creator: creator.toLowerCase() }
  );
  const tokens = Array.from(new Set(pots.map((p) => p.tokenAddress)));
  await Promise.all(tokens.map(getDecimals));
  return Promise.all(pots.map(mapRawPotToObject));
}
