import { UsersRound, DollarSign } from "lucide-react";
import type { TPotObject } from "@/lib/types";

export function EntryPeriodAndMembers({
	pot,
}: {
	pot: Pick<
		TPotObject,
		| "participants"
		| "round"
		| "maxParticipants"
		| "totalParticipants"
		| "entryAmountFormatted"
		| "periodString"
	>;
}) {
	return (
		<div className="flex items-end justify-start gap-8">
			{/* Participants */}
			<div className="flex items-end justify-start gap-1">
				<UsersRound
					strokeWidth="1.25px"
					size={18}
					color="#14b6d3"
					className="shrink-0"
				/>
				<span className="font-base text-[14px]">
					{`${String(pot.participants.length)}/${
						pot.round === 0
							? String(pot.maxParticipants)
							: String(pot.totalParticipants)
					}`}
				</span>
			</div>
			{/* Entry Period and Amount */}
			<div className="flex items-end justify-start gap-0">
				<DollarSign
					strokeWidth="1.25px"
					size={18}
					color="#14b6d3"
					className="shrink-0"
				/>
				<span className="font-base text-[14px]">
					{pot.entryAmountFormatted} {pot.periodString}
				</span>
			</div>
		</div>
	);
}
