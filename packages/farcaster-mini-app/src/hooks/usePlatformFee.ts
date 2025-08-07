import { useState, useEffect, useCallback } from 'react';
import { getParticipantFee, getPlatformFee } from '../lib/helpers/contract';
import { formatEther } from 'viem';
import { MAX_PARTICIPANTS } from '@/config';

interface FeeState {
  platformFeeWei: bigint | undefined;
  participantFeeWei: bigint | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

export interface UsePlatformFeeReturnType extends FeeState {
  platformFeeEth: string;
  participantFeeEth: string;
  refetch: () => Promise<void>;
  calculateCreatorFee: (maxParticipants: number) => undefined | { value: bigint; formatted: string };
  calculateJoineeFee: (maxParticipants: number) => undefined | { value: bigint; formatted: string };
}

export function usePlatformFee(): UsePlatformFeeReturnType {
  const [state, setState] = useState<FeeState>({
    platformFeeWei: undefined,
    participantFeeWei: undefined,
    isLoading: true,
    error: undefined,
  });

  const platformFeeEth: string = formatEther(state.platformFeeWei ?? 0n, 'wei');
  const participantFeeEth: string = formatEther(state.participantFeeWei ?? 0n, 'wei');

  console.log({
    platformFeeEth,
    participantFeeEth,
    platformFeeWei: state.platformFeeWei,
    participantFeeWei: state.participantFeeWei,
  })

  const fetchFee = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
      const platformFeeWei = await getPlatformFee();
      console.log('Fetched platformFee:', platformFeeWei);
      const participantFeeWei = await getParticipantFee();
      console.log('Fetched participantFee:', participantFeeWei);
      setState((prev) => ({ ...prev, platformFeeWei, participantFeeWei }));
    } catch (error) {
      console.error('Failed to fetch platform platformFee:', error);
      setState((prev) => ({ ...prev, error: error instanceof Error ? error : new Error('Failed to fetch platformFee or participantFee') }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchFee();
  }, [fetchFee]);

  const calculateCreatorFee: (maxParticipants: number) => undefined | { value: bigint; formatted: string } = (maxParticipants: number) => {
    if (state.platformFeeWei === undefined || state.participantFeeWei === undefined) {
      return undefined;
    }

    const value = state.platformFeeWei + state.participantFeeWei * BigInt(maxParticipants || MAX_PARTICIPANTS);
    const formatted = formatEther(value, "wei");

    return { value, formatted };
  }

  const calculateJoineeFee: (maxParticipants: number) => undefined | { value: bigint; formatted: string } = (maxParticipants: number) => {
    if (state.participantFeeWei === undefined) {
      return undefined;
    }

    const value = state.participantFeeWei * BigInt(maxParticipants || MAX_PARTICIPANTS);
    const formatted = formatEther(value, "wei");

    return { value, formatted };
  }

  return {
    ...state,
    platformFeeEth,
    participantFeeEth,
    refetch: fetchFee,
    calculateCreatorFee,
    calculateJoineeFee
  };
}
