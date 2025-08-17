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
import { getPotRoundParticipants } from "@/lib/graphQueries";
import { getPotParticipants } from "@/lib/helpers/contract";
import type { BulkUsersByAddressResponse, FUser } from '@/types/neynar';
import { fetchFarcasterUsersInBulk, sendDepositReminderNotification } from '@/lib/neynar';

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

// mapping for all participants in the latest round
const potIdToParticipantsMap = new Map<bigint, Address[]>();

// mapping for the winner of latest round
const potIdToWinnerMap = new Map<bigint, Address>();

// set of unique addresses for which farcaster usernames will be fetched
const addressSet = new Set<Address>();

// mapping for all farcaster users
const addressToFuserMap = new Map<Address, FUser>();

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

    // Before triggering pot payouts, fetch all participants of eligible pots,
    // as triggering will reset participants to only winner
    for (const potId of eligiblePayoutPots) {
      try {
        const participants: Address[] = await getPotParticipants(potId);
        // Ideally, this should never happen
        if (participants.length === 0) {
          console.warn(`No participants found for pot #${potId}. Skipping reminder notification.`);
          continue;
        }
        potIdToParticipantsMap.set(potId, participants.map((part) => part.toLowerCase() as Address));
        for (const participant of participants) {
          addressSet.add(participant.toLowerCase() as Address);
        }
      } catch (error) {
        // TODO: handle rpc rate limiting
        console.error(`Error fetching participants for pot #${potId}:`, error, "Skipping reminder notification");
        continue;
      }
    }

    // Trigger payouts in batch
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
      const receipt = await waitForTransactionReceipt(publicClient, { hash: txHash });
      console.log(`Batch payout transaction hash: ${receipt.transactionHash}`);
    }

    // After triggering pot payouts, fetch winners (participants[0]) of eligible pots
    for (const potId of eligiblePayoutPots) {
      try {
        const participants: Address[] = await getPotParticipants(potId);
        // Ideally, this should never happen
        if (participants.length === 0) {
          console.warn(`No participants found for pot #${potId}. Skipping reminder notification.`);
          continue;
        }
        potIdToWinnerMap.set(potId, participants[0].toLowerCase() as Address);
        addressSet.add(participants[0].toLowerCase() as Address);
      } catch (error) {
        // TODO: handle rpc rate limiting
        console.error(`Error fetching participants for pot #${potId}:`, error, "Skipping reminder notification");
        continue;
      }
    }

    // A case where for a pot id, potIdToParticipantsMap has values
    // but potIdToWinnerMap does not and vice versa (in case of rpc rate limiting)

    // Fetch Farcaster users for all addresses in batches of 350 (neynar api limit)
    const addressList = Array.from(addressSet);
    for (let i = 0; i < addressList.length; i += 350) {
      const batch = addressList.slice(i, i + 350);
      if (batch.length === 0) break;
      let batchData: BulkUsersByAddressResponse | null = null;

      try {
        const { data, error, status, ok } = await fetchFarcasterUsersInBulk(batch);

        if (status === 404) {
          console.warn(`Farcaster user not found for addresses: ${batch.join(", ")}`);
          console.warn("Skipping reminder notification for this batch");
        } else if (status === 429) {
          // Retry once after waiting for 65s
          await new Promise((resolve) => setTimeout(resolve, 65000));
          const retryResponse = await fetchFarcasterUsersInBulk(batch);
          if (retryResponse.status === 200) {
            // Successfully retried
            console.log(`Successfully retried batch: ${batch.join(", ")}`);
            batchData = retryResponse.data;
          } else {
            console.warn(`Failed to fetch batch after retry: ${batch.join(", ")}`);
            console.warn("Skipping reminder notification for this batch");
          }
        } else if (!ok || error) {
          console.warn(`Failed to fetch batch: ${batch.join(", ")}`);
          console.warn("Skipping reminder notification for this batch");
        } else {
          batchData = data;
        }
      } catch (e) {
        console.error(`Failed to fetch batch: ${batch.join(", ")}`);
        console.warn("Skipping reminder notification for this batch");
      }

      // Save batch data
      if (batchData) {
        // Process and save batchData to addressToFuserMap
        for (const [address, userData] of Object.entries(batchData)) {
          if (userData && userData.length > 0) {
            addressToFuserMap.set(address.toLowerCase() as Address, {
                fid: userData[0].fid,
                username: userData[0].username,
                display_name: userData[0].display_name,
                pfp_url: userData[0].pfp_url,
            });
          } else {
            console.warn(`No user data found for address: ${address}`);
          }
        }
      }
    }

    // Send reminder notifications for all pots
    for (const potId of eligiblePayoutPots) {
      let winnerName = 'Someone';
      const winnerAddr: Address | undefined = potIdToWinnerMap.get(potId);
      if (winnerAddr) {
        winnerName = addressToFuserMap.get(winnerAddr)?.username ?? 'Someone';
      }
      const participants = potIdToParticipantsMap.get(potId) || [];
      const targetFids = participants
							.map((participant) => addressToFuserMap.get(participant)?.fid)
							.filter((fid): fid is number => fid !== undefined);

      if (targetFids.length > 0) {
        try {
            console.log('Sending deposit reminder notification...');
            const notificationRes = await sendDepositReminderNotification({ potId: Number(potId), targetFids, winnerName });
            console.log('notification response', notificationRes);
            console.log('Deposit reminder notification sent successfully');
        } catch (error) {
            console.error(`Failed to send deposit reminder notification for pot #${potId}:`, error);
        }
      }
    }

    // Batch end pots
    if (eligibleEndPots.length > 0) {
      const txHash = await writeContract(walletClient, {
        address: batcherAddress,
        abi: batcherAbi,
        functionName: "endBatch",
        args: [eligibleEndPots],
      });
      console.log(`🔔 triggering batch end for ${eligibleEndPots.length} pots`);
      const receipt = await waitForTransactionReceipt(publicClient, { hash: txHash });
      console.log(`Batch end transaction hash: ${receipt.transactionHash}`);
    }

    // TODO: Some new users will be eligible for auto join only after the current round ends.
    // So it makes more sense to calculate their eligibility after triggering batch payout.

    // Batch auto join
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
        const receipt = await waitForTransactionReceipt(publicClient, { hash: txHash });
        console.log(`Batch join transaction hash: ${receipt.transactionHash}`);
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
