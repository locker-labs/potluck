import type React from "react";
import type { Address } from "viem";
import { GradientCard2 } from "../ui/GradientCard";
import { formatAddress } from "@/lib/address";
import type { FUser } from "@/types/neynar";
import Image from "next/image";

interface UserCardProps {
	user: FUser;
	address: Address | undefined;
}

const UserCard: React.FC<UserCardProps> = ({ user, address }) => {
	return (
		<GradientCard2 className="gap-4">
			{user ? (
				<div className="grid grid-cols-[48px_1fr] gap-3">
					<div>
						<Image
							src={user.pfpUrl || "/pfp_100px.webp"}
							alt="Logo"
							width={48}
							height={48}
							className="min-w-[48px] max-w-[48px] rounded-full outline outline-1 outline-app-cyan aspect-auto object-cover"
							draggable="false"
						/>
					</div>
					<div>
						<p className="font-bold text-xl">{user.display_name}</p>
						<div className="flex justify-between items-center">
							<p className="text-sm">@{user.username}</p>
							<p className="font-bold text-sm">{formatAddress(address)}</p>
						</div>
					</div>
				</div>
			) : (
				<p className="font-bold text-lg mb-1">{formatAddress(address)}</p>
			)}
		</GradientCard2>
	);
};

export default UserCard;
