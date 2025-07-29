"use client";

import { GradientButton, GradientButton2 } from "@/components/ui/Buttons";
import type { TPotObject } from "@/lib/types/contract.type";
import { Loader2 } from "lucide-react";
import type React from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import type { UseUserPotRequestInfoReturnType } from "@/hooks/useUserPotRequestInfo";

export interface JoinPotButtonProps {
	style: "purple" | "blue";
	loadingPot: boolean;
	pot: TPotObject;
	hasJoinedBefore: boolean | null;
	hasJoinedRound: boolean | null;
	joiningPotId: bigint | null;
	isLoadingJoinPot: boolean;
	tokenBalance: bigint | undefined;
	userPotRequestInfo: UseUserPotRequestInfoReturnType;
	handleJoinPot: (pot: TPotObject) => Promise<void>;
	handleRequest: (potId: bigint) => Promise<void>;
}

export function JoinPotButton({
	style,
	loadingPot,
	pot,
	hasJoinedBefore,
	hasJoinedRound,
	joiningPotId,
	isLoadingJoinPot,
	tokenBalance,
	userPotRequestInfo,
	handleJoinPot,
	handleRequest,
}: JoinPotButtonProps) {
	const { isAllowed, hasRequested, isRequestingPot, isRequestingThisPot } = userPotRequestInfo;
	const potId = pot.id;

	// HOOKS
	const { isConnected, address: addressWithCheckSum } = useAccount();
	const address = addressWithCheckSum?.toLowerCase() as Address | undefined;

	// DERIVED STATE
	const initialLoading: boolean = isLoadingJoinPot || loadingPot;
	const isPublic: boolean = pot.isPublic;
	const isRoundZero: boolean = pot.round === 0;
	const isJoiningPot: boolean = joiningPotId !== null;
	const isJoiningThisPot: boolean = isJoiningPot && joiningPotId === potId;
	const cannotJoinPot: boolean =
		!isRoundZero && hasJoinedBefore !== null && !hasJoinedBefore;
	const potFull: boolean =
		isRoundZero && pot.participants.length === pot.maxParticipants;
	const insufficientBalance: boolean =
		tokenBalance !== undefined && tokenBalance < pot.entryAmount;
	const deadlinePassed: boolean =
		pot.deadline < BigInt(Math.floor(Date.now() / 1000));

	const showLoader = initialLoading || isJoiningThisPot || isRequestingThisPot;

	const disabled: boolean =
		initialLoading ||
		potFull ||
		deadlinePassed ||
		(!!address &&
			(isJoiningPot ||
				isRequestingPot ||
				hasJoinedRound ||
				cannotJoinPot ||
				insufficientBalance ||
				(hasRequested && !isAllowed) ||
				(!pot.isPublic && hasRequested === null)));

	const buttonText = initialLoading ? (
		"Loading"
	) : hasJoinedRound ? (
		"Joined"
	) : isJoiningThisPot ? (
		"Joining"
	) : deadlinePassed ? (
		"Expired ⌛"
	) : potFull ? (
		"Pot Full 📦"
	) : !isConnected || !address ? (
		"Connect wallet to Join"
	) : insufficientBalance ? (
		"Insufficient Balance 💰"
	) : isRoundZero ? (
		isPublic ? (
			"Join Pot"
		) : isRequestingThisPot ? (
			"Requesting to Join"
		) : hasRequested === null ? (
			"Loading"
		) : hasRequested ? (
			isAllowed ? (
				"Join Pot"
			) : (
				"Approval pending"
			)
		) : (
			"Request to Join"
		)
	) : hasJoinedBefore ? (
		<span className={"flex items-center justify-center"}>
			<span>Pay This Round (</span>
			<span className={"mr-1"}>
				<Image src={"/usdc.png"} alt={"usdc"} width={16} height={16} />
			</span>
			<span>{pot.entryAmount})</span>
		</span>
	) : (
		"Cannot Join 😔"
	);

	const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (isPublic || isAllowed) {
			await handleJoinPot(pot);
		} else if (!hasRequested) {
			await handleRequest(pot.id);
		}
	};

	const buttonContent = (
		<span className={"flex items-center justify-center gap-2"}>
			<span>{buttonText}</span>
			{showLoader ? (
				<Loader2 className="animate-spin h-5 w-5 text-white" size={20} />
			) : null}
		</span>
	);

	if (style === "blue") {
		return (
			<GradientButton2
				isActive={true}
				className="w-full h-[35px] flex items-center justify-center mt-3 mx-auto shadow-lg hover:shadow-xl transition-all duration-300 text-base font-bold rounded-xl"
				onClick={onClick}
				disabled={disabled}
			>
				{buttonContent}
			</GradientButton2>
		);
	}

	if (style === "purple") {
		return (
			<GradientButton onClick={onClick} disabled={disabled} className="w-full">
				{buttonContent}
			</GradientButton>
		);
	}
}
