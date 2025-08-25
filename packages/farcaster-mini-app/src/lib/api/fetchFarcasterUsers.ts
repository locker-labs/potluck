import type { Address } from "viem";
import type { FUser } from "@/types/neynar";

type FetchFarcasterUsersParams = {
    addresses: Address[];
};

export async function fetchFarcasterUsers({ addresses }: FetchFarcasterUsersParams): Promise<{
    success?: boolean;
    data: Record<string, FUser>;
    error?: string;
}> {
    let response: Record<string, FUser> = {};

    try {
        const res = await fetch("/api/farcaster-users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                addresses,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Failed to fetch farcaster users:", data?.error);
            return { error: data?.error || "Failed to fetch farcaster users", data: response };
        }

        response = data.users || {};
    } catch (error) {
        console.error("Error fetching farcaster users:", error);
        return { error: "Failed to fetch farcaster users", data: response };
    }

    return { success: true, data: response };
}
