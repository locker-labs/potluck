"use client";

import { useEffect, useMemo } from "react";
import { Loader2, MoveUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { formatAddress } from "@/lib/address";
import { getTransactionLink } from "@/lib/helpers/blockExplorer";
import type { LogEntry } from "@/lib/graphQueries";
import type { Address } from "viem";
import type { FUser } from "@/types/neynar";

export function RecentActivity({
  logsState,
  users,
  fetchUsers,
}: {
  logsState: { loading: boolean; error: string | null; logs: LogEntry[] };
  users: Record<string, FUser | null>;
  fetchUsers: (addresses: Address[]) => void;
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: adding fetchUsers in deps might trigger unnecessary re-renders
  useEffect(() => {
    const addressSet = new Set<Address>();

    for (const act of activities) {
      if (act.type === "joined") {
        addressSet.add(act.data.user.toLowerCase() as Address);
      } else {
        addressSet.add(act.data.winner.toLowerCase() as Address);
      }
    }

    fetchUsers(Array.from(addressSet));
  }, [activities]);

  // 3️⃣ Group by date
		const { dateGroups, sortedDates } = useMemo(() => {
			const dateGroups: Record<string, LogEntry[]> = {};

			for (const log of activities) {
				const date = new Date(Number(log.timestamp) * 1000)
					.toISOString()
					.split("T")[0];
				if (!dateGroups[date]) {
					dateGroups[date] = [];
				}
				dateGroups[date].push(log);
			}

			const sortedDates = Object.keys(dateGroups).sort(
				(a, b) => new Date(b).getTime() - new Date(a).getTime(),
			);

			return { dateGroups, sortedDates };
		}, [activities]);

  return (
			<div className="max-h-[300px] overflow-y-auto">
				<Accordion type="multiple" defaultValue={sortedDates}>
					{sortedDates.map((date, dateIndex) => (
						<AccordionItem key={date} value={date} className="border-0">
							<AccordionTrigger
								className={`px-4 ${dateIndex === 0 ? "" : "border-t"} border-gray-500`}
							>
								{new Date(date).toLocaleDateString("en-US", {
									day: "2-digit",
									month: "short",
									year: "numeric",
								})}
							</AccordionTrigger>
							<AccordionContent className={"py-4 border-t border-gray-500"}>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{dateGroups[date]
										.filter(
											(log) => log.type === "joined" || log.type === "payout",
										)
										.sort(
											(a, b) =>
												new Date(Number(b.timestamp)).getTime() -
												new Date(Number(a.timestamp)).getTime(),
										)
										.map((log, idx) => {
											const isWinner = log.type === "payout";
											const userAddr = isWinner
												? (log.data.winner.toLowerCase() as Address)
												: (log.data.user.toLowerCase() as Address);
											const username = users[userAddr]
												? users[userAddr].username
												: formatAddress(userAddr);
											const action = isWinner ? "Winner" : "Deposited";

											return (
												<div
                        // biome-ignore lint/suspicious/noArrayIndexKey: not a dynamic list so works
													key={idx}
													className="px-4 flex items-center justify-between"
												>
													{/* Icon + Label */}
													<div className="flex items-start gap-2">
														{isWinner ? (
															"🎉"
														) : (
															<MoveUpRight
																strokeWidth="2px"
																size={18}
																className="text-app-cyan"
															/>
														)}
														<div className="flex flex-col gap-1.5">
															<p
																className={`leading-none text-base ${
																	isWinner ? "text-green-500" : "text-app-cyan"
																}`}
															>
																{action}
															</p>
															<p className="leading-none text-xs font-normal text-gray-200">
																{username}
															</p>
														</div>
													</div>

													{/* Amount + Link */}
													<div className="flex flex-col items-end gap-1.5">
														<div className="flex items-center">
															<span className="font-medium leading-none">
																${log.data.amount}
															</span>
														</div>
														<Link
															href={getTransactionLink(log.data.txHash)}
															target="_blank"
														>
															<div className="flex items-center gap-1">
																<p className="text-xs leading-none">
																	{new Date(
																		1000 * Number(log.timestamp),
																	).toLocaleTimeString("en-US", {
																		hour: "numeric",
																		minute: "numeric",
																		hour12: true,
																	})}
																</p>
																<ExternalLink size={12} />
															</div>
														</Link>
													</div>
												</div>
											);
										})}
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		);
}
