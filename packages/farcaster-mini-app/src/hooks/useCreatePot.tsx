import { publicClient } from '@/clients/viem';
import { contractAddress, abi, tokenAddress, PotCreatedEventSignatureHash, MAX_PARTICIPANTS } from '@/config';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useConnection } from '@/hooks/useConnection';
import { useFrame } from '@/providers/FrameProvider';
import { usePotluck } from '@/providers/PotluckProvider';
import { type Address, formatEther, formatUnits, toHex } from 'viem';

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
  const {
				platformFeeWei,
        platformFeeEth,
				participantFeeWei,
        participantFeeEth,
				calculateCreatorFee,
        calculateJoineeFee,
				isLoadingFee,
				dataNativeBalance,
				isLoadingNativeBalance,
				tokenBalance,
				isLoadingTokenBalance,
				tokenAllowance,
				isLoadingTokenAllowance,
				refetchTokenAllowance,
        refetch,
				approveTokens,
  } = usePotluck();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const isLoading: boolean = isLoadingTokenBalance || isLoadingTokenAllowance || isLoadingFee || isLoadingNativeBalance;

  const createPot = async (
    potName: string,
    amountBigInt: bigint,
    maxParticipants: number,
    timePeriod: bigint,
    isPublic: boolean,
    fee: bigint
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

      // broadcast transaction
      const txHash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "createPot",
        args,
        value: fee,
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
      console.error("Error creating pot:", error);
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
    console.log('maxParticipants', maxParticipants, 'handlecreatepot')
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
        toast.error("Failed to connect wallet");
        return;
      }
      setIsPending(true);
      return;
    }

    if (maxParticipants === 1) {
      toast.error("Max members should not be 1");
      return;
    }

    if (maxParticipants > MAX_PARTICIPANTS) {
      toast.error(`Max members should be less than ${1 + MAX_PARTICIPANTS}`);
      return;
    }

    const dataFee = calculateCreatorFee(maxParticipants);

    if (dataFee === undefined) {
      toast.error("Unable to fetch platform fee. Please try again");
      return;
    }

    if (tokenAllowance === undefined) {
      toast.error("Unable to fetch token allowance. Please try again");
      return;
    }

    if (dataNativeBalance === undefined) {
      toast.error("Unable to fetch native balance. Please try again");
      return;
    }

    if (tokenBalance === undefined) {
      toast.error("Unable to fetch token balance. Please try again");
      return;
    }

    if (dataFee.value > dataNativeBalance.value) {
      toast.error(`You do not have enough native tokens. Balance: ${Number(Number(formatEther(dataNativeBalance.value, "wei")).toFixed(4))} ETH`);
      return;
    }

    if (amount > tokenBalance) {
      toast.error(`You do not have enough USDC. Balance: ${Number(Number(formatUnits(tokenBalance, 6)).toFixed(4))} USDC`);
      return;
    }

    setIsCreatingPot(true);

    try {
      if (amount >= BigInt(tokenAllowance)) {
        await approveTokens(amount * BigInt(maxParticipants || MAX_PARTICIPANTS));
      }

      // TODO: replace with dataFee.value
      await createPot(potName, amount, maxParticipants, timePeriod, isPublic, dataFee.value * BigInt(maxParticipants || MAX_PARTICIPANTS));
    } catch (error) {
      toast.error("Error creating potluck", {
        description:
          error instanceof Error
            ? error.message?.split(".")?.[0]
            : "Something went wrong. Please try again",
      });
    } finally {
      setIsCreatingPot(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (
      isPending &&
      tokenAllowance !== undefined &&
      tokenBalance !== undefined &&
      platformFeeWei !== undefined &&
      participantFeeWei !== undefined
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
  }, [isPending, tokenAllowance, tokenBalance, platformFeeWei, participantFeeWei]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    refetch();
  }, [isCreatingPot]);

  return {
    potId,
    setPotId,
    isCreatingPot,
    handleCreatePot,
    hash,
    isLoading,
    tokenBalance,
    dataNativeBalance,
    calculateCreatorFee,
    calculateJoineeFee,
    platformFeeWei,
    participantFeeWei,
    platformFeeEth,
    participantFeeEth,
  };
}
