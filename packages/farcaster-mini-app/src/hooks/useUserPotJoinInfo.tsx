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
        if (enabled) {
            (async () => {
                if (address === pot.creator && pot.round === 0) {
                    setHasJoinedRound(true);
                    setHasJoinedBefore(true);
                } else {
                    setHasJoinedBefore(await getHasJoinedRound(pot.id, 0, address));
                }
            })();
        }
    }, [enabled, address, pot]);

    // Update hasJoinedRound when joinedPotId changes
    useEffect(() => {
        if (enabled) {
            if (!address) {
            setHasJoinedRound(false);
        } else {
            if (!hasJoinedRound) {
                if (joinedPotId === pot.id) {
                    setHasJoinedRound(true);
                } else {
                    setHasJoinedRound(pot.participants.includes(address));
                }
            }
        }
    }
    }, [joinedPotId, hasJoinedRound, pot, address, enabled]);

    // Reset hasJoinedRound if address changes
    useEffect(() => {
        if (!address) {
            setHasJoinedBefore(null);
            setHasJoinedRound(null);
        }
    }, [address])

    return { hasJoinedBefore, hasJoinedRound };
}
