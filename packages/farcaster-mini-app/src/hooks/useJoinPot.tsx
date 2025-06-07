import { publicClient } from '@/clients/viem';
import { contractAddress, abi } from '@/config';
import { useState } from 'react';
import { useAccount, useWriteContract } from "wagmi";
import { toast } from 'sonner';
import { useApproveTokens } from "@/hooks/useApproveTokens";
import type { TPotObject } from '@/lib/types';


export function useJoinPot() {
  const { allowance, isLoadingAllowance, approveTokensAsync, refetchAllowance } = useApproveTokens();
  const { address: joinee } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [joiningPotId, setJoiningPotId] = useState<bigint | null>(null);

  const joinPot = async (id: bigint): Promise<void> => {
    if (!joinee) {
        throw new Error("No account connected. Please connect your wallet.");
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
            const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 })
      
            if (receipt.status === 'reverted') {
                throw new Error(`Transaction reverted: https://sepolia.basescan.org/tx/${receipt.transactionHash}`);
            }
      
            console.log("Transaction confirmed:", receipt);
        } catch (error) {
            console.error("Error joining potluck:", error);
            throw error;
        }
    }

    const handleJoinPot = async (pot: TPotObject) => {
      if (!pot) return;
      const potId = pot.id;
      const entryAmount = pot.entryAmount;

      if (allowance === undefined) {
        toast.error("Unable to fetch token allowance. Please try again.");
        return;
      }

      setJoiningPotId(potId);

      try {

        if (entryAmount > BigInt(allowance)) {
          await approveTokensAsync(entryAmount);
          await refetchAllowance();
        }
        const res = await joinPot(potId);
        console.log("Join pot response:", res);

        // Check if the transaction was successful
    
        toast.success(`Successfully joined pot #${potId}`);
    
          // Show success message
      } catch (error: unknown) {
        console.error("Failed to join pot:", error);
        toast.error("Error joining pot", {
          description: error instanceof Error ? error.message?.split('.')?.[0] : "Something went wrong. Please try again.",
        });
      } finally {
        setJoiningPotId(null);
      }
    };

    return { joiningPotId, joinPot, handleJoinPot, isLoading: isLoadingAllowance }
}