// src/app/api/cron-payout/route.ts
import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { readContract, waitForTransactionReceipt, writeContract } from 'viem/actions';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  contractAddress,
  abi as potluckAbi,
  batcherAbi,
  batcherAddress,
} from "@/config";
import { RPC_URL } from "@/lib/constants";
import { env } from "@/app/api/env";
import type { Address } from "viem";
import { sendReminderNotificationForPot } from "@/lib/helpers/notifications";
import { getPotRoundParticipants } from "@/lib/graphQueries";
import { getPotParticipants } from "@/lib/helpers/contract";

// Object interface for easier access
interface PotObject {
  id: bigint;
  creator: Address;
  name: string;
  round: number;
  deadline: bigint;
  balance: bigint;
  token: Address;
  entryAmount: bigint;
  period: bigint;
  totalParticipants: number;
  isPublic: boolean;
}

// Helper function to convert pot array to object
function potArrayToObject(potArray: any): PotObject {
  return {
    id: potArray[0],
    creator: potArray[1], // hex encoded bytes
    name: potArray[2], // hex encoded bytes
    round: potArray[3],
    deadline: potArray[4],
    balance: potArray[5],
    token: potArray[6],
    entryAmount: potArray[7],
    period: potArray[8],
    totalParticipants: potArray[9],
    isPublic: potArray[10],
  };
}

async function toEndPot(potId: number) {
  try {
    await publicClient.simulateContract({
      address: contractAddress,
      abi: potluckAbi,
      functionName: "endPot",
      args: [BigInt(potId)],
      account: privateKeyToAccount(env.PAYOUT_PRIVATE_KEY as `0x${string}`), // or a valid account, if needed
    });
    console.log(`Pot #${potId} is eligible for ending`);
    return true;
  } catch {
    console.log(`Pot #${potId} is eligible for payout`);
    return false;
  }
}

async function toJoinOnBehalf(user: Address, potId: bigint) {
  try {
    await publicClient.simulateContract({
      address: contractAddress,
      abi: potluckAbi,
      functionName: "joinOnBehalf",
      args: [potId, user],
      account: user,
    });
    console.log(`User ${user} is eligible to join pot #${potId}`);
    return true;
  } catch {
    console.log(`User ${user} is not eligible to join pot #${potId}`);
    return false;
  }
}

// Cache to store pot state
interface PotState {
  deadline: bigint;
  balance: bigint;
}

// pot id to state mapping
const potStateCache = new Map<number, PotState>();
const ONE_HOUR_MS = 60 * 60 * 1000;
let potCacheTimestamp = Date.now();

// clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
  account: privateKeyToAccount(env.PAYOUT_PRIVATE_KEY as `0x${string}`),
});

export async function GET() {
  if (Date.now() - potCacheTimestamp > ONE_HOUR_MS) {
    potStateCache.clear();
    potCacheTimestamp = Date.now();
    console.log("🔔 Pot state cache cleared after one hour");
  }
  try {
    const potCount = Number(
      await readContract(publicClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: "potCount",
      })
    );

    const now = BigInt(Math.floor(Date.now() / 1000));
    const eligiblePayoutPots: bigint[] = [];
    const eligibleEndPots: bigint[] = [];
    const eligibleJoinPots: { potId: bigint; users: Address[] }[] = [];
    console.log(`🔔 Checking ${potCount} pots for payouts...`);
    // 1) Find all eligible pots
    for (let i = 0; i < potCount; i++) {
      // i is pot id
      if (potStateCache.has(i)) {
        const potState = potStateCache.get(i);
        if (potState && now >= potState.deadline && potState.balance > 0n) {
          const toEnd = await toEndPot(i);
          if (toEnd) {
            eligibleEndPots.push(BigInt(i));
          } else {
            eligiblePayoutPots.push(BigInt(i));
          }
        }
        continue;
      }

      const p = await readContract(publicClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: "pots",
        args: [BigInt(i)],
      });

      const pot = potArrayToObject(p);
      const currentDeadline = pot.deadline;
      if (now >= currentDeadline && pot.balance > 0n) {
        const toEnd = await toEndPot(i);
        if (toEnd) {
          eligibleEndPots.push(BigInt(i));
        } else {
          eligiblePayoutPots.push(BigInt(i));
        }
      } else if (now < currentDeadline) {
        potStateCache.set(i, {
          deadline: pot.deadline,
          balance: pot.balance,
        });
        const eligibleUsers: Address[] = [];
        const joinedParticipants = await getPotParticipants(BigInt(i));
        // Pot is not yet ended, check for auto joiners
        const roundContributions = await getPotRoundParticipants(
          BigInt(i),
          pot.round - 1
        );
        for (const contribution of roundContributions) {
          // If the user is already in joinedParticipants, skip
          if (joinedParticipants.includes(contribution.user.id)) {
            continue;
          }
          // Check if the user is allowed to join
          const toJoin = await toJoinOnBehalf(contribution.user.id, BigInt(i));
          if (toJoin) {
            eligibleUsers.push(contribution.user.id);
          }
        }
        if (eligibleUsers.length > 0)
          eligibleJoinPots.push({
            potId: BigInt(i),
            users: eligibleUsers,
          });
      }
    }

    // ToDo: Add batching for more than n (maybe 10/100) pots
    if (eligiblePayoutPots.length > 0) {
      const txHash = await writeContract(walletClient, {
        address: batcherAddress,
        abi: batcherAbi,
        functionName: "batchTriggerPayout",
        args: [eligiblePayoutPots],
      });
      console.log(
        `🔔 triggering batch payout for ${eligiblePayoutPots.length} pots`
      );
      await waitForTransactionReceipt(publicClient, { hash: txHash });

      // send new round reminder + winner announcement notifications to pot participants
      for (const potId of eligiblePayoutPots) {
        await sendReminderNotificationForPot(potId);
      }
    }
    if (eligibleEndPots.length > 0) {
      const txHash = await writeContract(walletClient, {
        address: batcherAddress,
        abi: batcherAbi,
        functionName: "endBatch",
        args: [eligibleEndPots],
      });
      console.log(`🔔 triggering batch end for ${eligibleEndPots.length} pots`);
      await waitForTransactionReceipt(publicClient, { hash: txHash });
    }
    if (eligibleJoinPots.length > 0) {
      console.log(
        `🔔 triggering batch join for ${eligibleJoinPots.length} pots`
      );
      for (const eligible of eligibleJoinPots) {
        const txHash = await writeContract(walletClient, {
          address: batcherAddress,
          abi: batcherAbi,
          functionName: "triggerBatchJoinOnBehalf",
          args: [eligible.potId, eligible.users],
        });
        await waitForTransactionReceipt(publicClient, { hash: txHash });
      }
    }
    return NextResponse.json({
      triggered: eligiblePayoutPots.length,
      ended: eligibleEndPots.length,
      autoJoined: eligibleJoinPots.length,
      success: true,
      checked: potCount,
    });
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (err: any) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
