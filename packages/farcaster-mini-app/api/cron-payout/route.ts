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
import { contractAddress,abi as potluckAbi } from "@/config"; // adjust path if needed

// envs
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL!;

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

    // 3) loop & trigger payouts
    for (let i = 0; i < potCount; i++) {
      const p = (await readContract(publicClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: "pots",
        args: [BigInt(i)],
      })) as any;
        console.log(p, now);
      if (p[4] > 0n && now >= p[3]) {
        console.log(`🔔 triggering payout on pot #${i}`);
        const txHash = await writeContract(walletClient, {
          address: contractAddress,
          abi: potluckAbi,
          functionName: "triggerPotPayout",
          args: [BigInt(i)],
        });
        await waitForTransactionReceipt(publicClient, { hash: txHash });
        console.log(`✅ payout tx mined: ${txHash}`);
      }
    }

    return NextResponse.json({ success: true, checked: potCount });
  } catch (err: any) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
