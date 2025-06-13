import { publicClient } from '@/clients/viem';
import { contractAddress, abi } from '@/config';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { useApproveTokens } from '@/hooks/useApproveTokens';
import type { TPotObject } from '@/lib/types';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useConnection } from '@/hooks/useConnection';

export function useJoinPot() {
  const { ensureConnection } = useConnection();
  const { data: tokenBalance, isLoading: isLoadingBalance } = useTokenBalance();
  const { allowance, isLoadingAllowance, approveTokensAsync, refetchAllowance } =
    useApproveTokens();
  const { address: joinee } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [pendingPot, setPendingPot] = useState<TPotObject | null>(null);
  const [joiningPotId, setJoiningPotId] = useState<bigint | null>(null);
  const isLoading: boolean = isLoadingBalance || isLoadingAllowance;

  const joinPot = async (id: bigint): Promise<void> => {
    if (!joinee) {
      throw new Error('No account connected. Please connect your wallet.');
    }
    try {
      // broadcast transaction
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: 'joinPot',
        args: [id, []],
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
    if (!pot) {
      toast.error('Pot not found.');
      return;
    }
    const potId: bigint = pot.id;
    const entryAmount: bigint = pot.entryAmount;

    if (!joinee) {
      try {
        await ensureConnection();
      } catch {
        console.error('Failed to connect wallet:');
        toast.error('Failed to connect wallet');
        return;
      }
      setPendingPot(pot);
      return;
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
      if (entryAmount > BigInt(allowance)) {
        await approveTokensAsync(entryAmount);
        await refetchAllowance();
      }

      await joinPot(potId);

      // Check if the transaction was successful

      toast.success(`Successfully joined pot #${potId}`);

      // Show success message
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

  useEffect(() => {
    if (pendingPot && allowance !== undefined && tokenBalance !== undefined) {
      handleJoinPot(pendingPot);
      setPendingPot(null);
    }
  }, [pendingPot, allowance, tokenBalance]);

  return { joiningPotId, joinPot, handleJoinPot, isLoading, tokenBalance };
}
