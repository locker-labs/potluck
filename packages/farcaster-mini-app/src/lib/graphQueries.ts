// graphQueries.ts
import { GraphQLClient, gql } from "graphql-request";
import type { TPotObject, TPotObjectMini } from "./types";
import { type Address, hexToString, formatUnits, type Hex } from "viem";
import { publicClient } from "@/clients/viem";
import { MAX_PARTICIPANTS } from "@/config";

const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/117923/prod-pot/version/latest";
const client = new GraphQLClient(SUBGRAPH_URL);

const GET_ALL_ROUND_ZERO_POTS = gql`
  query GetAllRoundZeroPots($first: Int!, $skip: Int!) {
    pots(
      first: $first
      skip: $skip
      where: { currentRound: 0 }
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

const GET_POT_FULL = gql`
  query GetPotInfo($potId: ID!) {
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
  }
`;

const GET_POT_INFO_MINI = gql`
  query GetPotInfoMini($potId: ID!) {
    pot(id: $potId) {
      id
      name
      creator {
        id
      }
      entryAmount
      tokenAddress
      participants {
        user {
          id
        }
      }
    }
  }
`;

const GET_POT_PARTICIPATION_INFO = gql`
  query GetPotParticipationInfo($potId: ID!, $userAddress: ID!) {
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
// Get pots by user (both created and joined)
// ——————————————————————————————————————————————————————————————
const GET_POTS_BY_USER = gql`
  query GetPotsByUser($user: ID!) {
    created: pots(
      where: { creator: $user, status: ACTIVE }
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
    joined: contributions(
      where: { user: $user }
      orderBy: timestamp
      orderDirection: desc
    ) {
      pot {
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
  }
`;

// ——————————————————————————————————————————————————————————————
// Get participants of a particular round of a pot
// ——————————————————————————————————————————————————————————————
const GET_POT_ROUND_PARTICIPANTS = gql`
  query GetParticipantsOfPotRound($potId: ID!, $roundNumber: Int!) {
    contributions(
      where: { pot: $potId, round_: { roundNumber: $roundNumber } }
      orderBy: timestamp
      orderDirection: asc
    ) {
      user {
        id
      }
      amount
      timestamp
      transactionHash
      participantIndex
    }
  }
`;

// ——————————————————————————————————————————————————————————————
// Get all allowed addresses for a pot
// ——————————————————————————————————————————————————————————————
const GET_POT_ALLOWED_USERS = gql`
  query GetAllowedUsers($potId: ID!) {
    pot(id: $potId) {
      allowedUsers {
        user {
          id
          address
        }
        addedAt
        addedBy {
          id
          address
        }
      }
    }
  }
`;

// ——————————————————————————————————————————————————————————————
// Get pending allow requests for a pot
// ——————————————————————————————————————————————————————————————
const GET_POT_PENDING_REQUESTS = gql`
  query GetPendingAllowRequests($potId: ID!) {
    pot(id: $potId) {
      allowRequests(where: { status: PENDING }) {
        user {
          id
          address
        }
        requestedAt
      }
    }
  }
`;

// ——————————————————————————————————————————————————————————————
// Raw types
// ——————————————————————————————————————————————————————————————

type RawRoundParticipant = {
  user: { id: Address };
  amount: string;
  timestamp: string;
  transactionHash: string;
  participantIndex: string;
};

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

type RawPotMini = Pick<
  RawPot,
  "id" | "name" | "creator" | "entryAmount" | "tokenAddress" | "participants"
>;

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

type GqlPotInfoResponse = {
  pot: RawPot;
  contributions: RawJoin[];
  payouts: RawPayout[];
};

type GqlPotParticipationInfoResponse = {
  allowRequests: { id: string }[];
  allowedUsers: { id: string }[];
};

type RawAllowedUser = {
  user: { id: Address; address: string };
  addedAt: string;
  addedBy: { id: Address; address: string };
};

type RawPendingRequest = {
  user: { id: Address; address: string };
  requestedAt: string;
};

// ——————————————————————————————————————————————————————————————
// LogEntry type
// ——————————————————————————————————————————————————————————————

export type LogEntry = {
  type: "created";
  timestamp: bigint;
  data: {
    potId: bigint;
    creator: Address;
  };
} | {
  type: "joined";
  timestamp: bigint;
  data: {
    amount: string;
    participantIndex: number;
    potId: bigint;
    round: number;
    txHash: string;
    user: Address;
  };
} | {
  type: "payout";
  timestamp: bigint;
  data: {
    amount: string;
    potId: bigint;
    round: number;
    txHash: string;
    winner: Address;
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
// MINI MAPPER: RawPotMini → TPotObjectMini
// ——————————————————————————————————————————————————————————————

async function mapRawPotToObjectMini(rp: RawPotMini): Promise<TPotObjectMini> {
  const entryAmount = BigInt(rp.entryAmount);
  const dec: number = await getDecimals(rp.tokenAddress);

  /**
   * @dev is this address in user.id always lowercase?
   */
  const participants = rp.participants.map((x) => x.user.id);
  const totalParticipants = participants.length;
  const totalPool: string = formatUnits(
    entryAmount * BigInt(totalParticipants),
    dec
  );

  return {
    id: BigInt(rp.id),
    name: decodePotName(rp.name),
    creator: rp.creator.id,
    totalPool,
  };
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
  const totalPool: string = formatUnits(
    entryAmount * BigInt(totalParticipants),
    dec
  );

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

  const deadlinePassed = deadline < BigInt(nowSec);
	const ended = balance === BigInt(0);

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
    maxParticipants: Number(rp.maxParticipants) || MAX_PARTICIPANTS,
    participants,
    isPublic: rp.isPublic,

    periodString,
    deadlineString,
    deadlinePassed,
    ended,
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
  const { pots } = await client.request<{ pots: RawPot[] }>(
    GET_ALL_ROUND_ZERO_POTS,
    {
      first,
      skip,
    }
  );

  const tokens = Array.from(new Set(pots.map((p) => p.tokenAddress)));
  await Promise.all(tokens.map((t) => getDecimals(t)));

  return Promise.all(pots.map(mapRawPotToObject));
}

export async function getPotsByUser(user: Address): Promise<TPotObject[]> {
  const vars = { user: user.toLowerCase() };
  const resp = await client.request<{
    created: RawPot[];
    joined: { pot: RawPot }[];
  }>(GET_POTS_BY_USER, vars);

  const rawSet = new Map<string, RawPot>();
  for (const rp of resp.created) rawSet.set(rp.id, rp);
  for (const j of resp.joined) rawSet.set(j.pot.id, j.pot);

  const rawPots = Array.from(rawSet.values()).sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt)
  );

  const tokens = Array.from(new Set(rawPots.map((p) => p.tokenAddress)));
  await Promise.all(tokens.map(getDecimals));

  return Promise.all(rawPots.map(mapRawPotToObject));
}

export async function fetchPotMiniInfo(potId: bigint): Promise<TPotObjectMini> {
  const vars = {
    potId: potId.toString(),
  };
  const { pot: rp } = await client.request<{ pot: RawPotMini }>(
    GET_POT_INFO_MINI,
    vars
  );

  return mapRawPotToObjectMini(rp);
}

export async function fetchPotInfo(potId: bigint): Promise<{
  pot: TPotObject;
  logs: LogEntry[];
}> {
  const vars = {
    potId: potId.toString(),
  };
  const {
    pot: rp, // raw pot
    contributions,
    payouts,
  } = await client.request<GqlPotInfoResponse>(GET_POT_FULL, vars);

  const pot = await mapRawPotToObject(rp);
  console.log("Pot fetched:", pot);
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
  };
}

export async function fetchPotParticipationInfo(
  potId: bigint,
  userAddress: Address
): Promise<{
  hasRequested: boolean;
  isAllowed: boolean;
}> {
  const vars = {
    potId: potId.toString(),
    userAddress: userAddress.toLowerCase(),
  };
  const { allowRequests, allowedUsers } =
    await client.request<GqlPotParticipationInfoResponse>(
      GET_POT_PARTICIPATION_INFO,
      vars
    );

  return {
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

export async function getPotRoundParticipants(
  potId: bigint,
  roundNumber: number
): Promise<RawRoundParticipant[]> {
  const vars = {
    potId: potId.toString(),
    roundNumber,
  };
  const { contributions } = await client.request<{
    contributions: RawRoundParticipant[];
  }>(GET_POT_ROUND_PARTICIPANTS, vars);
  return contributions;
}

export async function getPotAllowedUsers(potId: bigint): Promise<Address[]> {
  const vars = { potId: potId.toString() };
  const { pot } = await client.request<{
    pot: { allowedUsers: RawAllowedUser[] };
  }>(GET_POT_ALLOWED_USERS, vars);
  if (!pot?.allowedUsers) return [];
  return pot.allowedUsers.map((au) => au.user.id);
}

export async function getPotPendingRequests(potId: bigint): Promise<Address[]> {
  const vars = { potId: potId.toString() };
  const { pot } = await client.request<{
    pot: { allowRequests: RawPendingRequest[] };
  }>(GET_POT_PENDING_REQUESTS, vars);
  if (!pot?.allowRequests) return [];
  return pot.allowRequests.map((req) => req.user.id);
}
