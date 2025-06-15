// src/app/api/cron-payout/route.ts
import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
} from "viem";
import { readContract, waitForTransactionReceipt, writeContract } from "viem/actions";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { contractAddress,abi as potluckAbi } from "@/config"; 

// envs
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

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
  account: privateKeyToAccount(process.env.PRIVATE_KEY! as `0x${string}`),
});

// Helper function to check if a pot needs to be checked
function shouldCheckPot(potId: number, currentDeadline: bigint, currentBalance: bigint): boolean {
  const cachedState = potStateCache.get(potId);
  const now = BigInt(Math.floor(Date.now() / 1000));
  
  // If we haven't cached this pot's state or the deadline has passed
  if (!cachedState || now >= currentDeadline) {
    potStateCache.set(potId, { deadline: currentDeadline, balance: currentBalance });
    return true;
  }
  
  return false;
}

export async function GET() {
  try {
    const potCount = Number(
      await readContract(publicClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: "potCount",
      })
    );

    const now = BigInt(Math.floor(Date.now() / 1000));
    const eligiblePots: bigint[] = [];

    // 1) Find all eligible pots
    for (let i = 0; i < potCount; i++) {
      if(potStateCache.has(i)) {
        const potState = potStateCache.get(i)!;
        if(now >= potState.deadline && potState.balance > 0n) {
          eligiblePots.push(BigInt(i));
          console.log(`Pot #${i} is eligible for payout`);
        }
        continue;
      }

      const p = (await readContract(publicClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: "pots",
        args: [BigInt(i)],
      })) as any;
      
      const currentDeadline = p[3];
      const currentBalance = p[4];
      
      if (currentBalance > 0n && now >= currentDeadline) {
          eligiblePots.push(BigInt(i));
          console.log(`Pot #${i} is eligible for payout`);
      }
    }

    if (eligiblePots.length > 0) {
      const txHash = await writeContract(walletClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: "triggerBatchPayout",
        args: [eligiblePots],
      });
      console.log(`🔔 triggering batch payout for ${eligiblePots.length} pots`);
      await waitForTransactionReceipt(publicClient, { hash: txHash });
    }
    
    return NextResponse.json({ triggered: eligiblePots.length, success: true, checked: potCount });
  } catch (err: any) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
