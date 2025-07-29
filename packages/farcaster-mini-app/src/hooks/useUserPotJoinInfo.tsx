import { useEffect, useState } from "react";
import { getHasJoinedRound } from "@/lib/helpers/contract";
import type { Address } from "viem";
import type { TPotObject } from "@/lib/types";

type UseUserPotJoinInfoParams = {
    pot: TPotObject | null;
    address: Address | undefined;
    joinedPotId: bigint | null;
};

type UseUserPotJoinInfoReturnType = {
    hasJoinedBefore: boolean | null;
    hasJoinedRound: boolean | null;
};

/**
 * Custom hook to determine if a user has joined a pot before or in the current round
 * @param pot - The pot object
 * @param address - The user's address
 * @param joinedPotId - The ID of the pot the user joined
 * @returns An object containing the join status
 */
export function useUserPotJoinInfo({
    pot,
    address,
    joinedPotId,
}: UseUserPotJoinInfoParams): UseUserPotJoinInfoReturnType {
    const enabled = !!pot && !!address;
    const [hasJoinedBefore, setHasJoinedBefore] = useState<boolean | null>(null);
    const [hasJoinedRound, setHasJoinedRound] = useState<boolean | null>(
        enabled ? pot.participants.includes(address) : null,
    );

    // Fetch join status for round 0
    useEffect(() => {
        if (!enabled) {
            setHasJoinedBefore(null);
            setHasJoinedRound(null);
            return;
        }

        if (enabled) {
            (async () => {
                if (address === pot.creator && pot.round === 0) {
                    setHasJoinedRound(true);
                    setHasJoinedBefore(true);
                } else {
                    setHasJoinedRound(pot.participants.includes(address));
                    setHasJoinedBefore(await getHasJoinedRound(pot.id, 0, address));
                }
            })();
        }
    }, [enabled, address, pot]);

    // Update hasJoinedRound when user joins a new round (one time change)
    useEffect(() => {
        if (enabled) {
            if (joinedPotId === pot.id && !hasJoinedRound) {
                setHasJoinedRound(true);
            }
        }
    }, [joinedPotId, hasJoinedRound, pot, enabled]);

    return { hasJoinedBefore, hasJoinedRound };
}
