import { publicClient } from '@/clients/viem';
import { contractAddress, abi } from '@/config';
import { useState, useEffect } from 'react';
import { useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { useApproveTokens } from '@/hooks/useApproveTokens';
import type { TPotObject } from '@/lib/types';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useConnection } from '@/hooks/useConnection';
import { getHasJoinedRound } from '@/lib/helpers/contract';
import { useFrame } from '@/components/providers/FrameProvider';

export function useJoinPot() {
  const { checkAndAddMiniApp } = useFrame();
  const { address, ensureConnection, isConnected } = useConnection();
  const { data: tokenBalance, isLoading: isLoadingBalance } = useTokenBalance();
  const { allowance, isLoadingAllowance, approveTokensAsync, refetchAllowance } =
    useApproveTokens();
  const { writeContractAsync } = useWriteContract();

  const [pendingPot, setPendingPot] = useState<TPotObject | null>(null);
  const [joiningPotId, setJoiningPotId] = useState<bigint | null>(null);
  const [joinedPotId, setJoinedPotId] = useState<bigint | null>(null);

  const isLoading: boolean = isLoadingBalance || isLoadingAllowance;

  const joinPot = async (id: bigint): Promise<void> => {
    if (!address) {
      throw new Error('No account connected. Please connect your wallet.');
    }
    try {
      // broadcast transaction
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: 'joinPot',
        args: [id],
      });

      // wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

      if (receipt.status === 'reverted') {
        throw new Error(`Transaction reverted: ${getTransactionLink(receipt.transactionHash)}`);
      }

      console.log(`Transaction confirmed: ${getTransactionLink(receipt.transactionHash)}`);
    } catch (error) {
      console.error('Error joining potluck:', error);
      throw error;
    }
  };

  const handleJoinPot = async (pot: TPotObject) => {
    await checkAndAddMiniApp();

    if (!pot) {
      toast.error('Pot not found.');
      return;
    }
    const potId: bigint = pot.id;
    const entryAmount: bigint = pot.entryAmount;

    if (!address) {
      try {
        await ensureConnection();
      } catch {
        toast.error('Failed to connect wallet');
        return;
      }
      // setPendingPot(pot);
      return;
    }

    const hasJoinedRound: boolean = isConnected && !!address && pot.participants.includes(address);

    if (hasJoinedRound) {
      toast.error('You have already joined this pot.');
      return;
    }

    const isRoundZero: boolean = pot.round === 0;

    // check if user is trying to join a pot that has already started
    if (!isRoundZero) {
      setJoiningPotId(potId);
      let hasJoinedBefore: boolean | null = null;
      try {
        hasJoinedBefore = await getHasJoinedRound(pot.id, 0, address);
      } catch (e) {
        console.error('Failed to check if user has joined pot:', e);
        toast.error('Failed to check if user has joined pot');
        return;
      }
      if (!hasJoinedBefore) {
        toast.error(`Round ${1 + pot.round} has already started. You cannot join this pot.`);
        return;
      }
    }

    if (allowance === undefined) {
      toast.error('Unable to fetch token allowance. Please try again.');
      return;
    }

    if (tokenBalance === undefined) {
      toast.error('Unable to fetch token balance. Please try again.');
      return;
    }

    if (entryAmount > tokenBalance) {
      toast.error('You do not have enough USDC.');
      return;
    }

    setJoiningPotId(potId);

    try {
      setJoinedPotId(null);
      if (entryAmount > BigInt(allowance)) {
        await approveTokensAsync(entryAmount);
        await refetchAllowance();
      }
      await joinPot(potId);
      setJoinedPotId(potId);

      toast.success(`Successfully joined pot #${potId}`);
    } catch (error: unknown) {
      console.error('Failed to join pot:', error);
      toast.error('Error joining pot', {
        description:
          error instanceof Error
            ? error.message?.split('.')?.[0]
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setJoiningPotId(null);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: handleJoinPot and setPendingPot are not required in dependency array
  useEffect(() => {
    if (pendingPot && allowance !== undefined && tokenBalance !== undefined) {
      handleJoinPot(pendingPot);
      setPendingPot(null);
    }
  }, [pendingPot, allowance, tokenBalance]);

  return { joinedPotId, joiningPotId, joinPot, handleJoinPot, isLoading, tokenBalance };
}
