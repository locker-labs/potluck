import { timeFromNow } from "@/lib/helpers/time";
import { Pill } from "../ui/Pill";
import { Clock5 } from "lucide-react";
import type { TPotObject } from "@/lib/types";

export function DeadlinePill({
	pot,
	className = "",
	outerDivClassName = "",
	style = "pill",
	prefixText = "Next draw in:"
}: {
	pot: Pick<TPotObject, "ended" | "deadline" | "deadlinePassed">;
	className?: string;
	outerDivClassName?: string;
	style?: "pill" | "normal";
	prefixText?: string;
}) {
	const text = pot.ended
		? "Ended"
		: pot.deadlinePassed
			? "Awaiting payout"
			: `${prefixText} ${timeFromNow(Number(pot.deadline))}`;

	if (style === "pill") {
		return (
			<Pill className={outerDivClassName}>
				<Clock5 size={14} className="text-cyan-400" />
				<p className={`text-xs font-bold text-cyan-400 ${className}`}>{text}</p>
			</Pill>
		);
	}

	if (style === "normal") {
		return (
			<div className=" flex items-center justify-center gap-1">
				<Clock5 size={14} className="text-cyan-400" />
				<span className="font-bold text-[14px]">{text}</span>
			</div>
		);
	}

	return null;
}
