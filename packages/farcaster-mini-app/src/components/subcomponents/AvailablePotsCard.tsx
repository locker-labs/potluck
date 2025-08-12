import type { TPotObject } from "@/lib/types";
import type { Address } from "viem";
import { GradientCard } from "@/components/ui/GradientCard";
import { useAccount } from "wagmi";
import { JoinPotButton } from "@/components/buttons/JoinPotButton";
import { useUserPotRequestInfo } from "@/hooks/useUserPotRequestInfo";
import { useUserPotJoinInfo } from "@/hooks/useUserPotJoinInfo";
import { TransitionLink } from "@/components/TransitionLink";
import { DeadlinePill } from "./DeadlinePill";
import { PotInfo } from "./PotInfo";

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

	return (
		<GradientCard key={pot.id} className="py-4">
			<TransitionLink
				href={`/pot/${pot.id}`}
				className="h-full flex flex-col justify-between"
			>
				{/* top section */}
				<div className="flex justify-end items-start">
					<DeadlinePill pot={pot} style="normal" prefixText="Closes in" />
				</div>
				<p className="text-[24px] font-normal break-all line-clamp-1">{pot.name}</p>

				<PotInfo pot={pot} />

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
			</TransitionLink>
		</GradientCard>
	);
}
