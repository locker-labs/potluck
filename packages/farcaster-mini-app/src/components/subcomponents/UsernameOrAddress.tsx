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
				<div className="w-fit flex items-center gap-0.5">
					<AtSign
						strokeWidth="2px"
						size={18}
						color="#14b6d3"
						className="shrink-0 inline"
					/>
					<span className="text-[16px] font-medium break-all line-clamp-1">{username}</span>
				</div>
			) : (
				<p className="w-fit text-[16px] break-all line-clamp-1">
					<span className="text-app-cyan font-medium">{prefix}</span>
					<span className="text-white font-medium">{onlyAddress}</span>
				</p>
			)}
		</Link>
	);
}
