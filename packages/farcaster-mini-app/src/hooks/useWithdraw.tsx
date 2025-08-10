import { publicClient } from '@/clients/viem';
import { contractAddress, abi } from '@/config';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useConnection } from '@/hooks/useConnection';
import { useFrame } from '@/providers/FrameProvider';
import { usePotluck } from '@/providers/PotluckProvider';
import type { Address } from 'viem';

export function useWithdraw() {
  const [hash, setHash] = useState<Address | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  const { checkAndAddMiniApp } = useFrame();
  const { ensureConnection } = useConnection();
  const {
				dataNativeBalance,
				isLoadingNativeBalance,
        refetchNativeBalance,
        refetchTokenBalance,
        withdrawBalance,
        isLoadingWithdrawBalance,
        refetchWithdrawBalance
  } = usePotluck();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const isLoading = isLoadingNativeBalance || isLoadingWithdrawBalance;

  const withdraw = async (
    token: Address,
    amount: bigint  ): Promise<void> => {
    try {
      const args = [
        token,
        amount,
      ];

      // broadcast transaction
      const txHash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "withdraw",
        args,
      });

      // wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      if (receipt.status === "reverted") {
        throw new Error(
          `Transaction reverted: ${getTransactionLink(receipt.transactionHash)}`
        );
      }

      console.log(
        `Transaction confirmed: ${getTransactionLink(receipt.transactionHash)}`
      );

      setHash(txHash);
    } catch (error) {
      console.error(`Error withdrawing token: ${token} amount: ${amount}`, error);
      throw error;
    }
  };

  const handleWithdraw = async (
    token: Address,
    amount: bigint
  ) => {
    await checkAndAddMiniApp();
    setIsWithdrawing(true);

    if (!address) {
      try {
        await ensureConnection();
      } catch {
        toast.error("Failed to connect wallet");
        return;
      }
      return;
    }

    // TODO: estimate gas fee


    // if (gasFee === undefined) {
    //   toast.error("Unable to estimate gas fee. Please try again");
    //   return;
    // }

    if (dataNativeBalance === undefined) {
      toast.error("Unable to fetch native balance. Please try again");
      return;
    }

    if (withdrawBalance === undefined) {
      toast.error("Unable to fetch withdraw balance. Please try again");
      return;
    }

    if (withdrawBalance < amount) {
      toast.error("Insufficient withdraw balance");
      return;
    }

    // if (gasFee.value > dataNativeBalance.value) {
    //   toast.error(`You do not have enough native tokens. Balance: ${Number(Number(formatEther(dataNativeBalance.value, "wei")).toFixed(4))} ETH`);
    //   return;
    // }

    setIsWithdrawing(true);

    try {
      await withdraw(token, amount);
    } catch (error) {
      toast.error("Failed to withdraw", {
        description:
          error instanceof Error
            ? error.message?.split(".")?.[0]
            : "Something went wrong. Please try again",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Refetch native token balance on withdraw
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    refetchTokenBalance();
    refetchNativeBalance();
    refetchWithdrawBalance();
  }, [isWithdrawing]);

  return {
    isWithdrawing,
    handleWithdraw,
    hash,
    isLoading,
    dataNativeBalance,
    withdrawBalance,
    refetchWithdrawBalance
  };
}
