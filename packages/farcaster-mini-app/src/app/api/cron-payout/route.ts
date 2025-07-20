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
    name: potArray[1], // hex encoded bytes
    round: potArray[2],
    deadline: potArray[3],
    balance: potArray[4],
    token: potArray[5],
    entryAmount: potArray[6],
    period: potArray[7],
    totalParticipants: potArray[8],
    isPublic: potArray[9],
  };
}

async function toEndPot(potId: number) {
  try {
    await publicClient.simulateContract({
      address: contractAddress,
      abi: potluckAbi,
      functionName: 'triggerPotPayout',
      args: [BigInt(potId)],
      account: privateKeyToAccount(env.PAYOUT_PRIVATE_KEY as `0x${string}`), // or a valid account, if needed
    });
    console.log(`Pot #${potId} is eligible for payout`);
    return false;
  } catch {
    console.log(`Pot #${potId} is eligible for end`);
    return true;
  }
}

// Cache to store pot state
interface PotState {
  deadline: bigint;
  balance: bigint;
}

// pot id to state mapping
const potStateCache = new Map<number, PotState>();

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
  try {
    const potCount = Number(
      await readContract(publicClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: 'potCount',
      }),
    );

    const now = BigInt(Math.floor(Date.now() / 1000));
    const eligiblePayoutPots: bigint[] = [];
    const eligibleEndPots: bigint[] = [];

    // 1) Find all eligible pots
    for (let i = 0; i < potCount; i++) {
      // i is pot id
      if (potStateCache.has(i)) {
        const potState = potStateCache.get(i);
        if (potState && now >= potState.deadline) {
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
        functionName: 'pots',
        args: [BigInt(i)],
      });

      const pot = potArrayToObject(p);
      const currentDeadline = pot.deadline;
      if (now >= currentDeadline) {
        const toEnd = await toEndPot(i);
        if (toEnd) {
          eligibleEndPots.push(BigInt(i));
        } else {
          eligiblePayoutPots.push(BigInt(i));
        }
      }
    }

    // ToDo: Add batching for more than 10 pots
    if (eligiblePayoutPots.length > 0) {
      const txHash = await writeContract(walletClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: 'triggerBatchPayout',
        args: [eligiblePayoutPots],
      });
      console.log(`🔔 triggering batch payout for ${eligiblePayoutPots.length} pots`);
      await waitForTransactionReceipt(publicClient, { hash: txHash });

      // send new round reminder + winner announcement notifications to pot participants
      for (const potId of eligiblePayoutPots) {
        await sendReminderNotificationForPot(potId);
      }
    }
    if (eligibleEndPots.length > 0) {
      // ADD with latest contract update
      // const txHash = await writeContract(walletClient, {
      //   address: contractAddress,
      //   abi: potluckAbi,
      //   functionName: 'triggerBatchEnd',
      //   args: [eligibleEndPots],
      // });
      console.log(`🔔 triggering batch end for ${eligibleEndPots.length} pots`);
      // await waitForTransactionReceipt(publicClient, { hash: txHash });
    }

    return NextResponse.json({
      triggered: eligiblePayoutPots.length,
      success: true,
      checked: potCount,
    });
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (err: any) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
