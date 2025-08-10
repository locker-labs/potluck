"use client";

import { type Address, getAddress, isAddress } from "viem";
import { useEffect, useMemo } from "react";
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

export default function Profile({ address: rawAddress }: { address: Address }) {
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
				{/* <SectionHeading className="mx-4">My Profile</SectionHeading> */}
				<div className="flex flex-col gap-6">
					<div className="mt-4 px-4">
						<UserCard user={user} address={address} />
					</div>

					<div className="px-4">
						<TokenWithdraw address={address} isMyAddress={isMyAddress} />
					</div>

					<YourPots
						type="created"
						address={address}
						isConnectedAddress={isMyAddress}
					/>

					<div className="px-4">
						<Reputation />
					</div>
				</div>
			</div>
		</motion.div>
	);
}
