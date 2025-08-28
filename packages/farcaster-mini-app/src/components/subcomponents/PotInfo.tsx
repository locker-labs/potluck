import type { TPotObject } from "@/lib/types";
import { EntryPeriodAndMembers } from "./EntryPeriodAndMembers";

export function PotInfo({ pot }: { pot: TPotObject }) {
	return (
		<div>
			<div className="mt-2">
				{/* Total Pool Amount */}
				<p className="text-end text-cyan-400 font-bold text-[38px] leading-none">
					${pot.totalPool}
				</p>
			</div>
			<div className="mt-1 mb-2 w-full flex justify-between items-end">
				<EntryPeriodAndMembers pot={pot} />
				<div className="self-end">
					{/* Total Pool Text */}
					<p className="font-medium leading-relaxed">Total Pool</p>
				</div>
			</div>
		</div>
	);
}