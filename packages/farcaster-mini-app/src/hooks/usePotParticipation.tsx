import { useEffect, useState } from "react";
import { fetchPotParticipationInfo } from "@/lib/graphQueries";
import type { Address } from "viem";

interface UsePotParticipationState {
  loading: boolean;
  error: string | null;
  data: { isAllowed: boolean | null; hasRequested: boolean | null };
}

interface UsePotParticipationHook {
    isAllowed: boolean | null;
    hasRequested: boolean | null;
    loading: boolean;
    error: string | null;
}

export function usePotParticipation(
  potId: bigint,
  address: Address | undefined,
  enabled: boolean
): UsePotParticipationHook {
  const defaultParticipationState: UsePotParticipationState = {
    loading: false,
    error: null,
    data: { isAllowed: null, hasRequested: null },
  };

  const [participationState, setParticipationState] = useState<UsePotParticipationState>(
    defaultParticipationState
  );

  const resetParticipationState = () => {
    setParticipationState(defaultParticipationState);
  };

  // Load pot participation info when address is available and enabled
  useEffect(() => {
    if (!enabled || !address) {
      resetParticipationState();
      return;
    }

    (async function loadPotParticipationInfo() {
      setParticipationState((prev) => ({ ...prev, loading: true }));
      try {
        const info = await fetchPotParticipationInfo(potId, address);
        setParticipationState((prev) => ({ ...prev, data: info }));
      } catch {
        setParticipationState((prev) => ({
          ...prev,
          error: "Failed to load pot participation info",
        }));
      } finally {
        setParticipationState((prev) => ({ ...prev, loading: false }));
      }
    })();
  }, [potId, address, enabled]);

  const { loading, error, data } = participationState;
  const { isAllowed, hasRequested } = data;

  return { isAllowed, hasRequested, loading, error };
}