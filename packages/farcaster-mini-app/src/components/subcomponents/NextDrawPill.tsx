import { timeFromNow } from "@/lib/helpers/time";
import { Pill } from "../ui/Pill";
import { Clock5 } from "lucide-react";

export function NextDrawPill({
    deadline,
    deadlinePassed,
	className,
}: {
    deadline: bigint;
	deadlinePassed: boolean;
	className?: string;
}) {
    const text = deadlinePassed ? "Awaiting payout" : `Next draw in: ${timeFromNow(Number(deadline))}`
	return (
		<Pill>
			<Clock5 size={14} className="text-cyan-400" />
			<p className={`text-xs font-bold text-cyan-400 ${className}`}>
                {text}
            </p>
		</Pill>
	);
}
