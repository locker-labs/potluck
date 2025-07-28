import type { TPotObject } from "@/lib/types/contract.type";

export function UserContributionProgressBar({
	pot,
	hasJoinedRound,
}: {
	pot: TPotObject;
	hasJoinedRound: boolean;
}) {
	const completedContributions: number = hasJoinedRound
		? 1 + pot.round
		: pot.round;

	return (
		<div>
			<p className={"mt-4 text-xs text-white/80 leading-none"}>
				{completedContributions}/{pot.totalParticipants} contribution
				{pot.totalParticipants > 1 ? "s" : ""} complete
			</p>
			<div className="mt-1 w-full h-2 bg-[#2d0046] rounded-full">
				<div
					style={{
						width: `${Math.trunc(
							(100 * completedContributions) / pot.totalParticipants,
						)}%`,
					}}
					className={"rounded-full h-2 bg-green-500"}
				/>
			</div>
		</div>
	);
}