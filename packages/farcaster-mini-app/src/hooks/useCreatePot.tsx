import { publicClient } from '@/clients/viem';
import { contractAddress, abi, tokenAddress, PotCreatedEventSignatureHash } from '@/config';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { useApproveTokens } from '@/hooks/useApproveTokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useConnection } from '@/hooks/useConnection';
import { usePlatformFee } from '@/hooks/usePlatformFee';
import { type Address, toHex } from 'viem';
import { useFrame } from '@/components/providers/FrameProvider';

let _potName: string;
let _amount: bigint;
let _maxParticipants: number;
let _timePeriod: bigint;
let _isPublic: boolean;

export function useCreatePot() {
  const [isCreatingPot, setIsCreatingPot] = useState(false);
  const [potId, setPotId] = useState<bigint | null>(null);
  const [hash, setHash] = useState<Address | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  const { checkAndAddMiniApp } = useFrame();
  const { ensureConnection } = useConnection();
  const { data: tokenBalance, isLoading: isLoadingBalance } = useTokenBalance();
  const { fee, feeUsdc, isLoading: isLoadingFee } = usePlatformFee();
  const {
    allowance,
    isLoadingAllowance,
    approveTokensAsync,
    refetchAllowance,
  } = useApproveTokens();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const isLoading: boolean =
    isLoadingBalance || isLoadingAllowance || isLoadingFee;

  const createPot = async (
    potName: string,
    amountBigInt: bigint,
    maxParticipants: number,
    timePeriod: bigint,
    isPublic: boolean
  ): Promise<bigint> => {
    try {
      const args = [
        toHex(potName),
        tokenAddress,
        amountBigInt,
        maxParticipants,
        timePeriod,
        isPublic,
      ];
      console.log("Creating pot with args:", args);
      console.log("Creating pot with args:", {
        potName,
        tokenAddress,
        amount: amountBigInt.toString(),
        maxParticipants,
        timePeriod: timePeriod.toString(),
        fee: toHex(0),
      });
      console.log("contractAddress", contractAddress);
      // broadcast transaction
      const txHash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "createPot",
        args,
      });
      console.log(txHash);

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

      // parse logs to get pot ID
      const potCreatedEvent = receipt.logs.find(
        (log) => log.topics[0] === PotCreatedEventSignatureHash
      );
      if (!potCreatedEvent) {
        throw new Error("PotCreated event not found in transaction logs");
      }

      const id = BigInt(potCreatedEvent.topics[1] ?? "0");
      setHash(txHash);
      setPotId(id);
      return id;
    } catch (error) {
      console.error("Error creating potluck:", error);
      throw error;
    }
  };

  const handleCreatePot = async (
    potName: string,
    amount: bigint,
    maxParticipants: number,
    timePeriod: bigint,
    isPublic: boolean
  ) => {
    await checkAndAddMiniApp();

    _potName = potName;
    _amount = amount;
    _maxParticipants = maxParticipants;
    _timePeriod = timePeriod;
    _isPublic = isPublic;

    setPotId(null);

    if (!address) {
      try {
        await ensureConnection();
      } catch {
        console.error("Failed to connect wallet:");
        toast.error("Failed to connect wallet");
        return;
      }
      setIsPending(true);
      return;
    }

    if (fee === undefined) {
      toast.error("Unable to fetch platform fee. Please try again.");
      return;
    }

    if (allowance === undefined) {
      toast.error("Unable to fetch token allowance. Please try again.");
      return;
    }

    if (tokenBalance === undefined) {
      toast.error("Unable to fetch token balance. Please try again.");
      return;
    }

    if (amount > tokenBalance) {
      toast.error("You do not have enough USDC.");
      return;
    }

    setIsCreatingPot(true);

    try {
      const payAmount = amount + fee;
      if (payAmount >= BigInt(allowance)) {
        await approveTokensAsync(payAmount);
        await refetchAllowance();
      }

      await createPot(potName, amount, maxParticipants, timePeriod, isPublic);
    } catch (error) {
      console.error("Error creating potluck:", error);
      toast.error("Error creating potluck", {
        description:
          error instanceof Error
            ? error.message?.split(".")?.[0]
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsCreatingPot(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (
      isPending &&
      allowance !== undefined &&
      tokenBalance !== undefined &&
      fee !== undefined
    ) {
      handleCreatePot(
        _potName,
        _amount,
        _maxParticipants,
        _timePeriod,
        _isPublic
      )
        .then()
        .catch();
      setIsPending(false);
    }
  }, [isPending, allowance, tokenBalance, fee]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    refetchAllowance();
  }, [isCreatingPot]);

  return {
    potId,
    setPotId,
    isCreatingPot,
    createPot,
    handleCreatePot,
    hash,
    isLoading,
    tokenBalance,
    refetchAllowance,
    fee,
    feeUsdc,
  };
}
