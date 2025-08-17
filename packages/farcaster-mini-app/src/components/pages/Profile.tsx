"use client";

import { type Address, getAddress, isAddress } from "viem";
import { useEffect, useMemo, useState } from "react";
import UserCard from "../subcomponents/UserCard";
import TokenWithdraw from "../subcomponents/TokenWithdraw";
import YourPots from "../sections/YourPots";
import Reputation from "../subcomponents/Reputation";
import { useAccount } from "wagmi";
import { useFrame } from "@/providers/FrameProvider";
import { motion } from "motion/react";
import { initialDown, animate, transition } from "@/lib/pageTransition";
import { fallbackPfpUrl } from "@/lib/constants";
import { usePotluck } from "@/providers/PotluckProvider";
import BackButton from "../subcomponents/BackButton";
import ShareButton from "../subcomponents/ShareButton";
import { getProfileLink } from "@/lib/helpers/links";

export default function Profile({ address: rawAddress }: { address: Address }) {
	const [copied, setCopied] = useState(false);
	const { address: connectedAddress } = useAccount();
	const { users, fetchUsers } = usePotluck();
	const { context } = useFrame();

	const address = useMemo(() => {
		try {
			return isAddress(rawAddress) ? getAddress(rawAddress) : null;
		} catch {
			return null;
		}
	}, [rawAddress]);

	const fUser = address ? users[address.toLowerCase() as Address] : null;

	const isMyAddress =
		!!connectedAddress &&
		!!address &&
		connectedAddress.toLowerCase() === address.toLowerCase();

    // biome-ignore lint/correctness/useExhaustiveDependencies: only need to monitor address
	useEffect(() => {
		if (!address) {
			return;
		}
		fetchUsers([address]);
	}, [address]);

	if (!address) return null;

	const user =
		isMyAddress && context
			? {
					fid: context.user.fid,
					username: context.user.username ?? "",
					display_name: context.user.displayName ?? "",
					pfp_url: context.user.pfpUrl ?? fallbackPfpUrl,
				}
			: fUser;

	return (
		<motion.div initial={initialDown} animate={animate} transition={transition}>
			<div>
				<div className="px-4 w-full flex items-start justify-start gap-2 mb-4">
					<BackButton />
					<div className="w-full">
						<p className="text-2xl font-bold">Profile</p>
						{/* <p className="text-sm font-light">Manage your profile settings</p> */}
					</div>
					<ShareButton
						onClick={() => {
							const shareData = {
								title: "Potluck Profile",
								text: "Check out this Potluck profile!",
								url: getProfileLink(address),
							};
							if (navigator.share) {
								navigator.share(shareData).catch(() => {});
							} else {
								if (!copied) {
									navigator.clipboard.writeText(getProfileLink(address));
									setCopied(true);
									setTimeout(() => setCopied(false), 2000);
								}
							}
						}}
						copied={copied}
					/>
				</div>

				<div className="flex flex-col gap-6">
					<div className="px-4">
						<UserCard user={user} address={address} />
					</div>

					<div className="px-4">
						<TokenWithdraw address={address} isMyAddress={isMyAddress} />
					</div>

					<YourPots type="created" creator={address} />

					<div className="px-4">
						<Reputation />
					</div>
				</div>
			</div>
		</motion.div>
	);
}
