// src/app/api/cron-payout/route.ts
import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { readContract, waitForTransactionReceipt, writeContract } from 'viem/actions';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { contractAddress, abi as potluckAbi } from '@/config';
import { RPC_URL } from '@/lib/constants';
import { env } from '@/app/api/env';
import type { Address } from 'viem';
import { sendReminderNotificationForPot } from '@/lib/helpers/notifications';

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
    console.log(`Checking if pot #${potId} is eligible for ending`);
    await new Promise((resolve) => setTimeout(resolve, 100));
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

// Cache to store pot state
interface PotState {
  deadline: bigint;
  balance: bigint;
}

// pot id to state mapping
// const potStateCache = new Map<number, PotState>();
// const ONE_HOUR_MS = 60 * 60 * 1000;
// let potCacheTimestamp = Date.now();

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
  // if (Date.now() - potCacheTimestamp > ONE_HOUR_MS) {
  //   potStateCache.clear();
  //   potCacheTimestamp = Date.now();
  //   console.log("🔔 Pot state cache cleared after one hour");
  // }
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
     console.log(`🔔 Checking ${potCount} pots for payouts...`);
     // 1) Find all eligible pots
     for (let i = 0; i < potCount; i++) {
       // i is pot id

      // // Check if pot state is cached
      //  if (potStateCache.has(i)) {
      //    const potState = potStateCache.get(i);
      //    if (potState && now >= potState.deadline && potState.balance > 0n) {
      //      const toEnd = await toEndPot(i);
      //      if (toEnd) {
      //        eligibleEndPots.push(BigInt(i));
      //      } else {
      //        eligiblePayoutPots.push(BigInt(i));
      //      }
      //    }
      //    continue;
      //  }

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
       }
     }

     console.log("Payout pots:", eligiblePayoutPots);
     console.log("End pots:", eligibleEndPots);

     // ToDo: Add batching for more than n (maybe 10/100) pots
     if (eligiblePayoutPots.length > 0) {
      console.log(
         `🔔 triggering batch payout for ${eligiblePayoutPots.length} pots`
       );
       const txHash = await writeContract(walletClient, {
         address: contractAddress,
         abi: potluckAbi,
         functionName: "triggerBatchPayout",
         args: [eligiblePayoutPots],
       });
       console.log('triggerBatchPayout txHash', txHash);
       await waitForTransactionReceipt(publicClient, { hash: txHash });

       // send new round reminder + winner announcement notifications to pot participants
       for (const potId of eligiblePayoutPots) {
         await sendReminderNotificationForPot(potId);
       }
     }
     if (eligibleEndPots.length > 0) {
       console.log(
         `🔔 triggering endBatch for ${eligibleEndPots.length} pots`
       );
       const txHash = await writeContract(walletClient, {
         address: contractAddress,
         abi: potluckAbi,
         functionName: "endBatch",
         args: [eligibleEndPots],
       });
       console.log('endBatch txHash', txHash);
       await waitForTransactionReceipt(publicClient, { hash: txHash });
     }
     return NextResponse.json({
       triggered: eligiblePayoutPots.length,
       ended: eligibleEndPots.length,
       success: true,
       checked: potCount,
     });
     // biome-ignore lint/suspicious/noExplicitAny: <explanation>
   } catch (err: any) {
     console.error("Cron error:", err);
     return NextResponse.json({ error: err.message }, { status: 500 });
   }
}
