import { useState, useCallback, useEffect } from "react";
import type { Address } from "viem";
import type { FUser } from "@/types/neynar";
import { fetchFarcasterUsers } from "@/lib/api/fetchFarcasterUsers";

export function useNeynar() {
	const [users, setUsers] = useState<Record<Address, FUser | null>>({});
	const [isFetching, setIsFetching] = useState(false);
	const [fetchingAddresses, setFetchingAddresses] = useState<Address[]>([]);
	const [pendingAddresses, setPendingAddresses] = useState<Address[]>([]); // request queue

	console.log("useNeynar", {
		isFetching,
		users,
		fetchingAddresses,
		pendingAddresses,
	});

	const fetchAndStoreFarcasterUsers = async (addresses: Address[]) => {
		const newAddrs = addresses
			.map((addr) => addr.toLowerCase() as Address)
			.filter((addr) => !users[addr]);

		if (newAddrs.length === 0) return;

		setIsFetching(true);
		const { data: dataNewUsers, error } = await fetchFarcasterUsers({
			addresses: newAddrs,
		});
		const newUsersMap: Record<Address, FUser | null> = {};

		if (dataNewUsers && !error) {
			for (const addr of newAddrs) {
				newUsersMap[addr] = dataNewUsers[addr] ?? null;
			}
			setUsers((prev) => ({ ...prev, ...newUsersMap }));
		}

		// Remove the fetched addresses from fetchingAddresses and pendingAddresses
		setFetchingAddresses((prev) =>
			prev.filter((addr) => !newAddrs.includes(addr)),
		);
		setPendingAddresses((prev) =>
			prev.filter((addr) => !newAddrs.includes(addr)),
		);
		setIsFetching(false);
	};

	// Accepts new addresses and adds them to the pending queue
	const fetchUsers = (addresses: Address[]) => {
		const addrs = addresses.map((addr) => addr.toLowerCase() as Address);
		const newAddrs: Address[] = [];
		for (const addr of addrs) {
			if (
				users[addr] === undefined &&
				!pendingAddresses.includes(addr) &&
				!newAddrs.includes(addr)
			) {
				newAddrs.push(addr);
			}
		}
		if (newAddrs.length > 0) {
			setPendingAddresses((prev) => [...prev, ...newAddrs]);
		}
	};

	// Adds new addresses for fetching
    // biome-ignore lint/correctness/useExhaustiveDependencies: adding fetchUsers in deps might trigger unnecessary re-renders
	useEffect(() => {
		if (!isFetching && pendingAddresses.length > 0) {
			const newAddrs: Address[] = [];
			for (const addr of pendingAddresses) {
				if (
					users[addr] === undefined &&
					!fetchingAddresses.includes(addr) &&
					!newAddrs.includes(addr)
				) {
					newAddrs.push(addr);
				}
			}
			if (newAddrs.length === 0) return;
			fetchAndStoreFarcasterUsers(newAddrs);
			setFetchingAddresses([...fetchingAddresses, ...newAddrs]);
		}
	}, [pendingAddresses, isFetching]);

	return { users, fetchUsers };
}
