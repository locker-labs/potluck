import { publicClient } from '@/clients/viem';
import { contractAddress, abi } from '@/config';
import { useState, useEffect } from 'react';
import { useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import type { TPotObject } from '@/lib/types';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useConnection } from '@/hooks/useConnection';
import { useFrame } from '@/components/providers/FrameProvider';

export function useRequestPot() {
  const { checkAndAddMiniApp } = useFrame();
  const { address, ensureConnection, isConnected } = useConnection();
  const { writeContractAsync } = useWriteContract();
  const [pendingRequest, setPendingRequest] = useState<bigint | null>(null);

  const requestPotAllow = async (id: bigint): Promise<void> => {
    if (!address) {
      throw new Error('No account connected. Please connect your wallet.');
    }
    try {
      // broadcast transaction
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "requestPotAllow",
        args: [id],
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


  const handleRequest = async (potId: bigint) => {
    await checkAndAddMiniApp();

    console.log('handleRequest called with potId:', potId);
    if (potId==undefined) {
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
    setPendingRequest(potId);
    try {
      await requestPotAllow(potId);
      toast.success(`Successfully requested pot #${potId}`);
    } catch (error: unknown) {
      console.error('Failed to request pot:', error);
      toast.error('Error requesting pot', {
        description:
          error instanceof Error
            ? error.message?.split('.')?.[0]
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setPendingRequest(null);
    }
  };

  return { handleRequest, pendingRequest, requestPotAllow };
}
