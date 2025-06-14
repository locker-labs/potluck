import { useState, useEffect, useCallback } from 'react';
import { getPlatformFee } from '../lib/helpers/contract';

type PlatformFeeState = {
  fee: bigint | null;
  isLoading: boolean;
  error: Error | null;
};

type UsePlatformFeeReturn = PlatformFeeState & {
  refetch: () => Promise<void>;
};

export function usePlatformFee(): UsePlatformFeeReturn {
  const [state, setState] = useState<PlatformFeeState>({
    fee: null,
    isLoading: true,
    error: null,
  });

  const fetchPlatformFee = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const fee = await getPlatformFee();
      setState({
        fee,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to fetch platform fee:', error);
      setState({
        fee: null,
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
    refetch: fetchPlatformFee,
  };
}
