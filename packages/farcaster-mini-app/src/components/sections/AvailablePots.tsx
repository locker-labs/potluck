import { AvailablePotsCard } from "@/components/subcomponents/AvailablePotsCard";
import { GradientButton2 } from "@/components/ui/Buttons";
import { useJoinPot } from "@/hooks/useJoinPot";
import { getAllPotObjects } from "@/lib/graphQueries";
import { periodSecondsMap } from "@/lib/helpers/contract";
import type { TPotObject } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRequestPot } from "@/hooks/useRequestPot";

let _fetchPotsEffectFlag = true; // prevent multiple fetches

export default function AvailablePots() {
	const {
		isLoading: isLoadingJoinPot,
		joinedPotId,
		handleJoinPot,
		joiningPotId,
		tokenBalance,
	} = useJoinPot();
	const { handleRequest, requestingPotId, requestedPotId } = useRequestPot();

	// ------
	// STATES
	// ------

	const [loading, setLoading] = useState(true);
	const [pots, setPots] = useState<TPotObject[]>([]);
	const [selectedPeriod, setSelectedPeriod] = useState<
		"all" | "daily" | "weekly" | "monthly"
	>("all");

	// -------
	// EFFECTS
	// -------

	// Get logs from contract on mount
	useEffect(() => {
		if (!_fetchPotsEffectFlag) {
			console.log("Skipping fetch pots effect as it has already run.");
			return;
		}
		_fetchPotsEffectFlag = false;

		(async () => {
			const potObjs = await getAllPotObjects();
			setPots((prevPots) => [...prevPots, ...potObjs]);
			setLoading(false);
			_fetchPotsEffectFlag = true;
		})();
	}, []);

	// ---------
	// RENDERING
	// ---------

	// Filtered pots based on selected tab
	const filteredPots: TPotObject[] =
		selectedPeriod === "all"
			? pots
			: pots.filter((pot) => pot.period === periodSecondsMap[selectedPeriod]);

	return (
		<div>
			<h2 className="text-2xl font-bold mb-3">Available Pots</h2>
			{/* Filter Tabs */}
			<div className="max-w-min">
				<div className="flex gap-4 mb-4">
					{["all", "daily", "weekly", "monthly"].map((tab) => (
						<GradientButton2
							key={tab}
							onClick={() => {
								if (selectedPeriod !== tab)
									setSelectedPeriod(tab as typeof selectedPeriod);
							}}
							isActive={selectedPeriod === tab}
							className={`${
								selectedPeriod === tab
									? tab === "all"
										? "px-[21px]"
										: "px-[17px]"
									: tab === "all"
										? "px-[20px]"
										: "px-[16px]"
							}
              h-[40px] font-bold flex items-center text-[12px] rounded-full`}
						>
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</GradientButton2>
					))}
				</div>
			</div>
			{/* End Filter Tabs */}
			{!loading && filteredPots.length === 0 ? (
				<div className="text-center py-10 rounded-xl">
					No pots available.
					<br />
					Be the first to create one!
				</div>
			) : (
				<div className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 4xl:grid-cols-5 6xl:grid-cols-6 7xl:grid-cols-7">
					{filteredPots.map((pot: TPotObject) => (
						<AvailablePotsCard
							key={pot.id}
							pot={pot}
                            loadingPot={loading}
                            isLoadingJoinPot={isLoadingJoinPot}
							joiningPotId={joiningPotId}
							joinedPotId={joinedPotId}
							handleJoinPot={handleJoinPot}
							tokenBalance={tokenBalance}
                            handleRequest={handleRequest}
                            requestingPotId={requestingPotId}
                            requestedPotId={requestedPotId}
						/>
					))}
				</div>
			)}
			{loading ? (
				<div className="mt-4 w-full flex justify-center">
					<Loader2 className="animate-spin" color="#7C65C1" size={32} />
				</div>
			) : null}
		</div>
	);
}
