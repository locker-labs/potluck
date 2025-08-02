import type { TPotObject } from "@/lib/types";
import type { Address } from "viem";
import { Clock5, UsersRound } from "lucide-react";
import { GradientCard } from "@/components/ui/GradientCard";
import { useAccount } from "wagmi";
import { JoinPotButton } from "@/components/buttons/JoinPotButton";
import { useUserPotRequestInfo } from "@/hooks/useUserPotRequestInfo";
import { useUserPotJoinInfo } from "@/hooks/useUserPotJoinInfo";
import { TransitionLink } from "@/components/TransitionLink";

export function AvailablePotsCard({
	pot,
	isLoadingJoinPot,
	joiningPotId,
	joinedPotId,
	handleJoinPot,
	tokenBalance,
	handleRequest,
	requestingPotId,
	requestedPotId,
}: {
	pot: TPotObject;
	isLoadingJoinPot: boolean;
	joiningPotId: bigint | null;
	joinedPotId: bigint | null;
	handleJoinPot: (pot: TPotObject) => Promise<void>;
	tokenBalance: bigint | undefined;
	loadingPot: boolean;
	handleRequest: (potId: bigint) => Promise<void>;
	requestingPotId: bigint | null;
	requestedPotId: bigint | null;
}) {
	const { address: addressWithCheckSum } = useAccount();
	const address = addressWithCheckSum?.toLowerCase() as Address | undefined;

	const isPrivatePot: boolean = pot ? !pot.isPublic : false;
	const userPotRequestInfo = useUserPotRequestInfo({
		potId: pot.id,
		address,
		requestingPotId,
		requestedPotId,
		enabled: isPrivatePot,
	});

	const { hasJoinedBefore, hasJoinedRound } = useUserPotJoinInfo({
		pot,
		address,
		joinedPotId,
	});

	// DERIVED STATE
	const isRoundZero: boolean = pot.round === 0;
	const deadlinePassed: boolean =
		pot.deadline < BigInt(Math.floor(Date.now() / 1000));

	return (
		<GradientCard key={pot.id} className="py-5">
			<TransitionLink
				href={`/pot/${pot.id}`}
				className="h-full flex flex-col justify-between"
			>
				{/* top section */}
				<div>
					<p className="text-[24px] font-normal line-clamp-1">{pot.name}</p>
					<div className="mt-2 grid grid-cols-3">
						<div className="col-start-3 text-start">
							<p className="text-cyan-400 font-bold text-[28px] leading-none">
								${pot.totalPool}
							</p>
							<p className="text-[13px] font-light leading-relaxed">
								Total Pool
							</p>
						</div>
					</div>
				</div>

				{/* bottom section */}
				<div>
					<div className="mt-3 mb-2 grid grid-cols-5">
						<div className="col-span-3 grid grid-cols-2">
							<div className="flex items-end justify-start gap-1">
								<UsersRound
									strokeWidth="1.25px"
									size={18}
									color="#14b6d3"
									className="shrink-0"
								/>
								<span className="font-base text-[14px]">
									{`${String(pot.participants.length)}/${
										isRoundZero
											? String(pot.maxParticipants)
											: String(pot.totalParticipants)
									}`}
								</span>
							</div>
							<p className="font-base text-[14px] self-end">
								${pot.entryAmountFormatted} {pot.periodString}
							</p>
						</div>
						<div className="col-start-4 col-span-2 self-end">
							{/*  TODO: Create a reusable component  */}
							<div className=" flex items-center justify-center gap-1">
								<Clock5 size={14} color="#14b6d3" className="shrink-0" />
								<span className="font-bold text-[14px]">
									{deadlinePassed
										? "Awaiting Payout"
										: `Closes in ${pot.deadlineString}`}
								</span>
							</div>
						</div>
					</div>
					<JoinPotButton
						style="purple"
						loadingPot={false}
						pot={pot}
						isLoadingJoinPot={isLoadingJoinPot}
						joiningPotId={joiningPotId}
						tokenBalance={tokenBalance}
						hasJoinedBefore={hasJoinedBefore}
						hasJoinedRound={hasJoinedRound}
						handleJoinPot={handleJoinPot}
						userPotRequestInfo={userPotRequestInfo}
						handleRequest={handleRequest}
					/>
				</div>
			</TransitionLink>
		</GradientCard>
	);
}
