// src/app/api/cron-payout/route.ts
import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { readContract, waitForTransactionReceipt, writeContract } from 'viem/actions';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { contractAddress, abi as potluckAbi } from '@/config';
import { RPC_URL } from '@/lib/constants';
import { env } from '@/app/api/env';

// Cache to store pot state
interface PotState {
  deadline: bigint;
  balance: bigint;
}

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
    const eligiblePots: bigint[] = [];

    // 1) Find all eligible pots
    for (let i = 0; i < potCount; i++) {
      if (potStateCache.has(i)) {
        const potState = potStateCache.get(i);
        if (potState && now >= potState.deadline && potState.balance > 0n) {
          eligiblePots.push(BigInt(i));
          console.log(`Pot #${i} is eligible for payout`);
        }
        continue;
      }

      const p = (await readContract(publicClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: 'pots',
        args: [BigInt(i)],
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      })) as any;

      const currentDeadline = p[3];
      const currentBalance = p[4];

      if (currentBalance > 0n && now >= currentDeadline) {
        eligiblePots.push(BigInt(i));
        console.log(`Pot #${i} is eligible for payout`);
      }
    }
    // ToDo: Add batching for more than 10 pots
    if (eligiblePots.length > 0) {
      const txHash = await writeContract(walletClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: 'triggerBatchPayout',
        args: [eligiblePots],
      });
      console.log(`🔔 triggering batch payout for ${eligiblePots.length} pots`);
      await waitForTransactionReceipt(publicClient, { hash: txHash });
    }

    return NextResponse.json({ triggered: eligiblePots.length, success: true, checked: potCount });
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (err: any) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
