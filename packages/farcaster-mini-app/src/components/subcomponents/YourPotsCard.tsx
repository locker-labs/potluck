import { useState, useEffect } from "react";
import type { TPotObject } from "@/lib/types";
import type { Address } from "viem";
import { Loader2, UsersRound } from "lucide-react";
import { BorderButton, GradientButton4 } from "../ui/Buttons";
import { GradientCard2 } from "../ui/GradientCard";
import { NextDrawPill } from "./NextDrawPill";
import { PotProgressBar } from "./PotProgressBar";
import { TransitionLink } from "@/components/TransitionLink";

export function YourPotCard({
	pot,
	joiningPotId,
	joinedPotId,
	handleJoinPot,
	address,
	className,
	tokenBalance,
}: {
	pot: TPotObject;
	joiningPotId: bigint | null;
	joinedPotId: bigint | null;
	handleJoinPot: (pot: TPotObject) => void;
	address: Address;
	className?: string;
	tokenBalance: bigint | undefined;
}) {
	const [hasJoinedRound, setHasJoinedRound] = useState<boolean>(
		pot.participants.includes(address),
	);

	// Update hasJoinedRound when joinedPotId changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!hasJoinedRound) {
			if (joinedPotId === pot.id) {
				setHasJoinedRound(true);
			} else {
				setHasJoinedRound(pot.participants.includes(address));
			}
		}
	}, [joinedPotId, address]);

	// DERIVED STATE
	const isRoundZero: boolean = pot.round === 0;
	const isJoiningPot: boolean = joiningPotId === pot.id;
	const initialLoading: boolean = false;
	const insufficientBalance: boolean =
		tokenBalance !== undefined && tokenBalance < pot.entryAmount;

	const disabled: boolean =
		pot.ended ||
		isJoiningPot ||
		hasJoinedRound ||
		initialLoading ||
		insufficientBalance ||
		pot.deadlinePassed;

	const joinButtonText = initialLoading
		? "Loading"
		: pot.ended
			? "Ended"
		: hasJoinedRound
			? "Joined"
			: isJoiningPot
				? "Joining"
				: pot.deadlinePassed
					? "Expired ⌛"
					: insufficientBalance
						? "Insufficient Balance 💰"
						: isRoundZero
							? "Join Pot"
							: "Join Round";

	const onClickPayRound = (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
	) => {
		e.stopPropagation();
		e.preventDefault();
		handleJoinPot(pot);
	};

	return (
		<GradientCard2
			key={pot.id}
			className={`min-w-[315px] max-w-full p-[12px] ${className}`}
		>
			<div className={"flex justify-end"}>
				<NextDrawPill pot={pot} className={"text-[15px]"} />
			</div>
			<p className="text-[18px] font-bold leading-[1.2] line-clamp-1">
				{pot.name}
			</p>

			<div className="mt-2 grid grid-cols-5">
				{/* Total Pool amount */}
				<div className="col-span-5">
					<p className="w-full text-end text-cyan-400 font-bold text-[38px] leading-none">
						${pot.totalPool}
					</p>
				</div>

				{/* Participants, Entry amount, Total pool text */}
				<div className="col-span-3 grid grid-cols-2">
					<div className="flex items-center justify-start gap-1">
						<UsersRound strokeWidth="1.25px" size={18} color="#14b6d3" />
						<span className="font-base text-[14px]">
							{isRoundZero
								? `${String(pot.participants.length)}/${String(
										pot.maxParticipants,
									)}`
								: `${String(pot.participants.length)}/${String(
										pot.totalParticipants,
									)}`}
						</span>
					</div>
					<p className="font-base text-[14px] whitespace-nowrap text-left">
						${pot.entryAmountFormatted} {pot.periodString}
					</p>
				</div>
				<p className="col-span-2 font-base text-[14px] text-right">
					Total Pool
				</p>
			</div>

			{/* Pot progress bar */}
			<PotProgressBar pot={pot} />

			{/* Buttons */}
			<div className={"w-full mt-[14px] grid grid-cols-2 gap-4"}>
				{/* View Details Button */}
				<TransitionLink href={`/pot/${pot.id}`}>
				<BorderButton
					type="button"
					className="h-[30px] max-w-min min-w-[87px] whitespace-nowrap flex items-center justify-center"
				>
					View Details
				</BorderButton>
				</TransitionLink>

				{/* Join Round Button */}
				<GradientButton4
					type="button"
					isActive={true}
					onClick={onClickPayRound}
					disabled={disabled}
					className="h-[30px] max-w-min min-w-[87px] whitespace-nowrap flex items-center justify-center justify-self-end"
				>
					<span className={"flex items-center justify-center gap-2"}>
						<span>{joinButtonText}</span>
						{isJoiningPot ? (
							<Loader2 className="animate-spin h-4 w-4 text-white" size={20} />
						) : null}
					</span>
				</GradientButton4>
			</div>
		</GradientCard2>
	);
}
