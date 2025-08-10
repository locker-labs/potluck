"use client";

import type { UserContext } from "@farcaster/frame-core/dist/context";
import UserCard from "../subcomponents/UserCard";
import TokenWithdraw from "../subcomponents/TokenWithdraw";
import YourPots from "../sections/YourPots";
import Reputation from "../subcomponents/Reputation";
import { useAccount } from "wagmi";
import { useFrame } from "@/providers/FrameProvider";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { initialDown, animate, transition } from "@/lib/pageTransition";
// import { SectionHeading } from "../ui/SectionHeading";

export function MyProfilePage() {
	const { address } = useAccount();
	const { context } = useFrame();

	if (!context) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<Loader2 className="animate-spin h-5 w-5 text-app-purple" size={20} />
			</div>
		);
	}

	const user: UserContext = context.user;

	if (!address) return null;

	return (
		<motion.div initial={initialDown} animate={animate} transition={transition}>
			<div>
				{/* <SectionHeading className="mx-4">My Profile</SectionHeading> */}
				<div className="flex flex-col gap-6">
					<div className="mt-4 px-4">
						<UserCard
							user={{
								fid: user.fid,
								username: user.username || "",
								display_name: user.displayName || "",
								pfp_url: user.pfpUrl || "",
							}}
							address={address}
						/>
					</div>

					<div className="px-4">
						<TokenWithdraw address={address} isMyAddress={true} />
					</div>

					<YourPots type="created" address={address} isConnectedAddress={true} />

					<div className="px-4">
						<Reputation />
					</div>
				</div>
			</div>
		</motion.div>
	);
}
