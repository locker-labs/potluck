import type { TPotObject } from "@/lib/types/contract.type";
import { timeRemaining } from "@/lib/helpers/time";
import { periodSecondsMap } from "@/lib/helpers/contract";

export function PotProgressBar({ pot }: { pot: TPotObject }) {
	let periodFormat: "days" | "weeks" | "months" = "days";
	switch (pot.period) {
		case periodSecondsMap.daily:
			periodFormat = "days";
			break;
		case periodSecondsMap.weekly:
			periodFormat = "weeks";
			break;
		case periodSecondsMap.monthly:
			periodFormat = "months";
			break;
	}

	const totalRounds: number = pot.totalParticipants; // 4
	
	const currentRound: number = 1 + pot.round; // pot.round = 0 denotes round 1
	const pendingRounds: number = totalRounds - currentRound;
	const secondsNow = Math.floor(new Date().getTime() / 1000);

	const totalPotDurationSeconds = Number(pot.period) * totalRounds;
	const secondsToEndPendingRounds = Number(pot.period) * pendingRounds;
	const secondsToEndCurrentRound = Math.max(0, Number(pot.deadline) - secondsNow);

	const secondsToEndPot = secondsToEndPendingRounds + secondsToEndCurrentRound;
	const secondsSinceStart = totalPotDurationSeconds - secondsToEndPot;
	const timeRemainingStr = timeRemaining(secondsNow + secondsToEndPot, periodFormat);

	const timeRemainingText = timeRemainingStr ? `${timeRemainingStr} remaining` : "Completed";

	const progressPercent = Math.trunc(100 * Math.min(1, Number((secondsSinceStart / totalPotDurationSeconds).toFixed(2))))
	const width = `${progressPercent}%`;

	return (
		<div>
			<p className={"mt-4 text-xs text-white/80 leading-none"}>
				{timeRemainingText}
			</p>
			<div className="mt-1 w-full h-2 bg-[#2d0046] rounded-full">
				<div style={{ width }} className={"rounded-full h-2 bg-green-500"} />
			</div>
		</div>
	);
}