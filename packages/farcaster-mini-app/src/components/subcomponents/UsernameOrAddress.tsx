import type { Address } from "viem";
import { formatAddress } from "@/lib/address";
import { AtSign } from "lucide-react";
import Link from "next/link";
import { getProfileLink } from "@/lib/helpers/links";

export function UsernameOrAddress({
	username,
	address,
}: { username?: string; address: Address }) {
	const prefix = "0x";
	const onlyAddress = address.startsWith(prefix)
		? formatAddress(address).slice(prefix.length)
		: formatAddress(address);

	return (
		<Link className="w-fit" href={getProfileLink(address)} onClick={(e) => e.stopPropagation()}>
			{username ? (
				<div className="w-fit flex items-center group">
					<span className="pr-1 font-normal">by</span>
					<AtSign
						strokeWidth="2px"
						size={16}
						color="#14b6d3"
						className="shrink-0 inline"
					/>
					<span className="text-[16px] font-medium break-all line-clamp-1 group-hover:underline">{username}</span>
				</div>
			) : (
				<p className="w-fit break-all line-clamp-1 group">
					<span className="text-[16px] pr-1 font-normal">by</span>
					<span className="text-[14px] text-app-cyan font-medium">{prefix}</span>
					<span className="text-[14px] text-white font-medium group-hover:underline">{onlyAddress}</span>
				</p>
			)}
		</Link>
	);
}
