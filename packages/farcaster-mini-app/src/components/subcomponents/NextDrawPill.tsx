import { timeFromNow } from "@/lib/helpers/time";
import { Pill } from "../ui/Pill";
import { Clock5 } from "lucide-react";
import type { TPotObject } from "@/lib/types";

export function NextDrawPill({
	pot,
	className,
}: {
    pot: Pick<TPotObject, "ended" | "deadline" | "deadlinePassed">;
	className?: string;
}) {
    const text = pot.ended
					? "Ended"
					: pot.deadlinePassed
						? "Awaiting payout"
						: `Next draw in: ${timeFromNow(Number(pot.deadline))}`;

	return (
		<Pill>
			<Clock5 size={14} className="text-cyan-400" />
			<p className={`text-xs font-bold text-cyan-400 ${className}`}>
                {text}
            </p>
		</Pill>
	);
}
