import { useState, useEffect, useCallback } from 'react';
import { getPlatformFee } from '../lib/helpers/contract';
import { formatUnits } from 'viem';

type PlatformFeeState = {
  fee: bigint | undefined;
  isLoading: boolean;
  error: Error | undefined;
};

type UsePlatformFeeReturn = PlatformFeeState & {
  feeUsdc: string;
  refetch: () => Promise<void>;
};

export function usePlatformFee(): UsePlatformFeeReturn {
  const [state, setState] = useState<PlatformFeeState>({
    fee: undefined,
    isLoading: true,
    error: undefined,
  });

  const feeUsdc: string = formatUnits(state.fee ?? 0n, 6);

  const fetchPlatformFee = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
      const fee = await getPlatformFee();
      setState({
        fee,
        isLoading: false,
        error: undefined,
      });
    } catch (error) {
      console.error('Failed to fetch platform fee:', error);
      setState({
        fee: undefined,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch platform fee'),
      });
    }
  }, []);

  useEffect(() => {
    fetchPlatformFee();
  }, [fetchPlatformFee]);

  return {
    ...state,
    feeUsdc,
    refetch: fetchPlatformFee,
  };
}
