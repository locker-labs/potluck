import { publicClient } from '@/clients/viem';
import { contractAddress, abi } from '@/config';
import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useConnection } from '@/hooks/useConnection';
import type { Address } from 'viem';

export function useAllowPotRequest() {
  const { address, ensureConnection } = useConnection();
  const { writeContractAsync } = useWriteContract();
  const [pendingApproval, setPendingApproval] = useState<bigint | null>(null);

  const allowAddresses = async (id: bigint, addresses: Address[]): Promise<void> => {
    if (!address) {
      throw new Error('No account connected. Please connect your wallet.');
    }
    try {
      // broadcast transaction
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "allowParticipants",
        args: [id, addresses],
      });

      // wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

      if (receipt.status === 'reverted') {
        throw new Error(`Transaction reverted: ${getTransactionLink(receipt.transactionHash)}`);
      }

      console.log(`Transaction confirmed: ${getTransactionLink(receipt.transactionHash)}`);
    } catch (error) {
      console.error('Error requesting pot approval:', error);
      throw error;
    }
  };


  const handleAllow = async (potId: bigint, addresses: Address[]) => {
    if (!potId) {
      toast.error('Pot not found.');
      return;
    }
    if (!address) {
      try {
        await ensureConnection();
      } catch {
        toast.error('Failed to connect wallet');
        return;
      }
      return;
    }
    setPendingApproval(potId);
    try {
      await allowAddresses(potId, addresses);
      toast.success(`Successfully allowed addresses for pot #${potId}`);
    } catch (error: unknown) {
      console.error('Failed to allow addresses for pot:', error);
      toast.error('Error allowing addresses for pot', {
        description:
          error instanceof Error
            ? error.message?.split('.')?.[0]
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setPendingApproval(null);
    }
  };

  return { handleAllow, pendingApproval, allowAddresses };
}
