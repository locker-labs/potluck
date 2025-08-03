"use client";

import { useState, useEffect } from "react";
import type { Address } from "viem";
import { Copy, ExternalLink } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import Image from "next/image";
import { formatAddress } from "@/lib/address";
import { GradientButton3 } from "../ui/Buttons";
import { getTransactionLink } from "@/lib/helpers/blockExplorer";
import { useCopyInviteLink } from "@/hooks/useCopyInviteLink";
import { useCreateCast } from "@/hooks/useCreateCast";

export function CreatePotSuccessDialog({
	hash,
	potId,
	amountBigInt,
	timePeriod,
}: {
	hash: Address | null;
	potId: bigint | null;
	amountBigInt: bigint;
	timePeriod: bigint;
}) {
	const [showSuccessModal, setShowSuccessModal] = useState(false);

	const { handleCopyLink } = useCopyInviteLink({ potId });
	const { handleCastOnFarcaster } = useCreateCast({
		potId,
		amount: amountBigInt,
		period: timePeriod,
	});

	// // EFFECTS

	// Show success modal when pot is created
	useEffect(() => {
		if (!!hash && !!potId) {
			setShowSuccessModal(true);
		}
	}, [hash, potId]);

	// // Redirect to pot page when success modal is closed
	// // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	// useEffect(() => {
	// 	if (!showSuccessModal && potId) {
	// 		router.push(`/pot/${potId}`);
	// 		// setPotId(null);
	// 	}
	// }, [showSuccessModal]);

	return (
		<Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
			<DialogContent className="sm:max-w-md rounded-2xl text-white">
				<DialogHeader>
					<DialogTitle className="text-center text-2xl font-bold">
						Congratulations! 🎉
					</DialogTitle>
					<div className="text-center">
						<div>
							<Image
								src="/success.gif"
								alt="Success"
								width={150}
								height={150}
								className="mx-auto rounded-full"
								priority
							/>
							<h3 className="text-xl font-bold mb-2">
								Your pot has been created!
							</h3>
							<p className="mb-6">
								Share with friends to start saving together. The more people
								that join, the more everyone saves!
							</p>
							{hash && (
								<div className="flex w-full items-center justify-center gap-2">
									<p>Transaction Hash: </p>
									<Link href={getTransactionLink(hash)} target="_blank">
										<div className="flex items-center justify-center gap-2">
											<p>{formatAddress(hash)}</p>
											<ExternalLink size={16} color="#ffffff" />
										</div>
									</Link>
								</div>
							)}
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 mt-2">
					<GradientButton3
						type="button"
						className="w-full flex items-center justify-center gap-2"
						onClick={handleCastOnFarcaster}
					>
						<Image
							src="/farcaster-transparent-white.svg"
							alt="Farcaster"
							width={22}
							height={22}
							priority
						/>
						<span className="text-[20px] font-medium">Cast on Farcaster</span>
					</GradientButton3>

					<GradientButton3
						className="w-full flex items-center justify-center gap-2"
						onClick={handleCopyLink}
					>
						<Copy size={18} />
						<span className="text-[20px] font-medium">Copy Invite Link</span>
					</GradientButton3>

					<Link href={`/pot/${potId}`} className="w-full">
						<div className="w-full text-center rounded-xl py-3 mt-4 bg-white/80">
							<span className="text-[20px] text-center font-medium text-black">
								Go to Pot
							</span>
						</div>
					</Link>
				</div>
			</DialogContent>
		</Dialog>
	);
}