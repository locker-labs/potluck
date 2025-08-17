"use server";

import { env } from "@/lib/env";
import type { BulkUsersByAddressResponse } from "@/types/neynar";

/**
 * Fetches Farcaster users by their Ethereum addresses (atmost 350 at once)
 * Learn More: https://docs.neynar.com/reference/fetch-bulk-users-by-eth-or-sol-address
 * @param addresses - Array of Ethereum addresses to look up
 * @returns Promise<BulkUsersByAddressResponse> - Object mapping addresses to their Farcaster user data
 */
export async function getFarcasterUsersByAddresses(
	addresses: string[],
): Promise<BulkUsersByAddressResponse> {
	const { data, status, ok, error } =
		await fetchFarcasterUsersInBulk(addresses);

	// Address not found
	if (status === 404) {
		return data;
	}

	if (!ok || error) {
		throw new Error(`API request failed: ${status} ${error}`);
	}

	return data;
}

/**
 * Fetches Farcaster users by their Ethereum addresses (atmost 350 at once)
 * Learn More: https://docs.neynar.com/reference/fetch-bulk-users-by-eth-or-sol-address
 * @param addresses - Array of Ethereum addresses to look up
 * @param addressTypes - Optional array specifying which address types to search ('custody_address' | 'verified_address')
 * @param viewerFid - Optional FID of the viewer for context
 * @returns Promise<{
 * 	data: BulkUsersByAddressResponse;
 * 	ok: boolean;
 * 	status: number;
 * 	statusText: string;
 * 	error: string | null;
 * }>
 */
export async function fetchFarcasterUsersInBulk(
	addresses: string[],
	addressTypes?: ("custody_address" | "verified_address")[],
	viewerFid?: number,
): Promise<{
	data: BulkUsersByAddressResponse;
	ok: boolean;
	status: number;
	statusText: string;
	error: string | null;
}> {
	const responseObject: {
		data: BulkUsersByAddressResponse;
		ok: boolean;
		status: number;
		statusText: string;
		error: string | null;
	} = {
		data: {},
		ok: true,
		status: 200,
		statusText: "OK",
		error: null,
	};

  if (!Array.isArray(addresses) || addresses.length === 0) {
		throw new Error("Addresses must be a non-empty array.");
	}

	if (!env.NEYNAR_API_KEY) {
		throw new Error("Missing NEYNAR API key");
	}

	const baseUrl = "https://api.neynar.com/v2/farcaster/user/bulk-by-address";

	// Build query parameters
	const params = new URLSearchParams({
		addresses: addresses.join(","),
	});

	if (addressTypes && addressTypes.length > 0) {
		params.append("address_types", addressTypes.join(","));
	}

	if (viewerFid) {
		params.append("viewer_fid", viewerFid.toString());
	}

	const url = `${baseUrl}?${params.toString()}`;

	try {
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"x-api-key": env.NEYNAR_API_KEY,
				"x-neynar-experimental": "false",
			},
		});

		responseObject.status = response.status;
		responseObject.statusText = response.statusText;
		responseObject.ok = response.ok;

		// Address not found
		if (response.status === 404) {
			responseObject.error = "Address not found";
		} else {
			const data: BulkUsersByAddressResponse = await response.json();
			responseObject.data = data;
		}
	} catch (error) {
		responseObject.error =
			error instanceof Error ? error.message : String(error);
	}

	return responseObject;
}
