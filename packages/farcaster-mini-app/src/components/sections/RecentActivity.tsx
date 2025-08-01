"use client";

import { Loader2, MoveUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatAddress } from "@/lib/address";
import { formatDateFromTimestamp } from "@/lib/date";
import { getTransactionLink } from "@/lib/helpers/blockExplorer";
import type { LogEntry } from "@/lib/graphQueries";

export function RecentActivity({
  logsState,
}: {
  logsState: { loading: boolean; error: string | null; logs: LogEntry[] };
}) {
  // 1️⃣ Loading / Error states
  if (logsState.loading) {
    return (
      <div className="py-4 flex items-center justify-center w-full h-[300px]">
        <Loader2 className="animate-spin" color="#7C65C1" size={32} />
      </div>
    );
  }
  if (logsState.error) {
    return (
      <div className="py-4 flex items-center justify-center w-full h-[300px]">
        <p className="text-red-500">Error: {logsState.error}</p>
      </div>
    );
  }

  // 2️⃣ Filter only deposits & payouts
  const activities = logsState.logs.filter(
    (log) => log.type === "joined" || log.type === "payout"
  );

  return (
    <div className="py-4 max-h-[300px] overflow-y-auto">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((log, idx) => {
          const isWinner = log.type === "payout";
          const action = isWinner ? "Winner Payout" : "Deposited";
          const amount = log.data.amount;
          const txHash = log.data.txHash as string;

          return (
            <div key={idx} className="px-4 flex items-start justify-between">
              {/* Icon + Label */}
              <div className="flex items-start gap-2">
                {isWinner ? (
                  "🎉"
                ) : (
                  <MoveUpRight
                    className="mt-0.5"
                    strokeWidth="2px"
                    size={20}
                    color="#14b6d3"
                  />
                )}
                <div>
                  <p
                    className={`text-base ${
                      isWinner ? "text-green-500" : "text-app-cyan"
                    }`}
                  >
                    {action}
                  </p>
                  <div className="text-xs">
                    {formatDateFromTimestamp(Number(log.timestamp))}
                  </div>
                </div>
              </div>

              {/* Amount + Link */}
              <div>
                <div className="mb-1.5 flex items-center">
                  <Image src="/usdc.png" alt="usdc" width={16} height={16} />
                  <span className="ml-1 leading-none">{amount}</span>
                </div>
                <Link href={getTransactionLink(txHash)} target="_blank">
                  <div className="flex items-center gap-1">
                    <p className="text-xs leading-none">
                      {formatAddress(txHash as `0x${string}`)}
                    </p>
                    <ExternalLink size={12} />
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
