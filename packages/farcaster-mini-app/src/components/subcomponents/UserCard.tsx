import type React from "react";
import type { Address } from "viem";
import { GradientCard2 } from "../ui/GradientCard";
import { formatAddress } from "@/lib/address";
import type { FUser } from "@/types/neynar";
import Image from "next/image";
import { fallbackPfpUrl } from "@/lib/constants";

interface UserCardProps {
	user: FUser | null;
	address: Address;
}

const UserCard: React.FC<UserCardProps> = ({ user, address }) => {
	return (
		<GradientCard2 className="gap-4">
			{user?.username && user.display_name ? (
				<div className="grid grid-cols-[48px_1fr] gap-3">
					<div>
						<Image
							src={user.pfp_url || fallbackPfpUrl}
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
							<button
								type="button"
								className="font-bold text-sm cursor-pointer"
								onClick={async () => {
									if (address) {
										await navigator.clipboard.writeText(address);
									}
								}}
							>
								{formatAddress(address)}
							</button>
						</div>
					</div>
				</div>
			) : (
				<div className="flex gap-2">
					<p className="font-medium text-xl">Address:</p>
					<button
						type="button"
						className="font-bold text-xl cursor-pointer"
						onClick={async () => {
							if (address) {
								await navigator.clipboard.writeText(address);
							}
						}}
					>
						{formatAddress(address)}
					</button>
				</div>
			)}
		</GradientCard2>
	);
};

export default UserCard;
