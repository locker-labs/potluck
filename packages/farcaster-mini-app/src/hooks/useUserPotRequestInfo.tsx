import { useEffect, useState } from "react";
import { fetchPotParticipationInfo } from "@/lib/graphQueries";
import type { Address } from "viem";

interface UseUserPotRequestInfoState {
  isAllowed: boolean | null;
  hasRequested: boolean | null;
  loading: boolean;
  error: string | null;
}

export interface UseUserPotRequestInfoReturnType extends UseUserPotRequestInfoState {
  isRequestingPot: boolean;
  isRequestingThisPot: boolean;
  isRequestingOtherPot: boolean;
};

interface UseUserPotRequestInfoParams {
  potId: bigint;
  requestingPotId: bigint | null;
  requestedPotId: bigint | null;
  address: Address | undefined;
  enabled: boolean;
}

const defaultState: UseUserPotRequestInfoState = {
  isAllowed: null,
  hasRequested: null,
  loading: false,
  error: null,
};

export function useUserPotRequestInfo({
  potId,
  requestingPotId,
  requestedPotId,
  address,
  enabled
}: UseUserPotRequestInfoParams): UseUserPotRequestInfoReturnType {
  const [state, setState] = useState<UseUserPotRequestInfoState>(defaultState);
  const { loading, error, isAllowed, hasRequested } = state;

  // Load pot participation info when address is available and enabled
  useEffect(() => {
    if (!enabled || !address) {
      setState(defaultState);
      return;
    }

    (async function loadPotRequestInfoInfo() {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const info = await fetchPotParticipationInfo(potId, address);
        setState((prev) => ({ ...prev, isAllowed: info.isAllowed, hasRequested: info.hasRequested }));
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Failed to load pot participation info",
        }));
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    })();
  }, [potId, address, enabled]);


  // Update hasRequested when requests to join a pot (one time change)
  useEffect(() => {
    if (enabled) {
      if (requestedPotId === potId && !hasRequested) {
        setState((prev) => ({ ...prev, hasRequested: true }));
      }
    }
  }, [requestedPotId, hasRequested, potId, enabled]);

  const isRequestingPot: boolean = requestingPotId !== null;
  const isRequestingThisPot: boolean = isRequestingPot && requestingPotId === potId;
  const isRequestingOtherPot: boolean = isRequestingPot && requestingPotId !== potId;

  return { loading, error, isAllowed, hasRequested, isRequestingPot, isRequestingThisPot, isRequestingOtherPot };
}