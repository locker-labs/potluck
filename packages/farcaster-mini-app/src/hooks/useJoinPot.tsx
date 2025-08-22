import { publicClient } from '@/clients/viem';
import { contractAddress, abi } from '@/config';
import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import type { TPotObject } from '@/lib/types';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useConnection } from '@/hooks/useConnection';
import { getHasJoinedRound } from '@/lib/helpers/contract';
import { useFrame } from '@/providers/FrameProvider';
import { usePotluck } from '@/providers/PotluckProvider';
import { JoinPotDisclaimer } from "@/components/disclaimers/JoinPotDisclaimer";

export function useJoinPot() {
  const [joiningPotId, setJoiningPotId] = useState<bigint | null>(null);
  const [joinedPotId, setJoinedPotId] = useState<bigint | null>(null);

  const { checkAndAddMiniApp } = useFrame();
  const { address, ensureConnection, isConnected } = useConnection();
  const {
    isLoading,
    tokenBalance,
    dataNativeBalance,
    tokenAllowance,
    approveTokens,
    refetchTokenAllowance,
    calculateJoineeFee,
  } = usePotluck();
  const { writeContractAsync } = useWriteContract();
  const { askDisclaimer, DisclaimerModal } = JoinPotDisclaimer();

  const joinPot = async (id: bigint, joineeFee: bigint): Promise<void> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      // broadcast transaction with joinee fee as value
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: "joinPot",
        args: [id],
        value: joineeFee,
      });

      // wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
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
    } catch (error) {
      console.error("Error joining pot:", error);
      throw error;
    }
  };

  const handleJoinPot = async (pot: TPotObject) => {
    await checkAndAddMiniApp();

    const acknowledged = await askDisclaimer(
      pot.isPublic ? "public" : "private"
    );
    if (!acknowledged) return;

    if (!pot) {
      toast.error("Pot not found");
      return;
    }
    const potId: bigint = pot.id;
    const entryAmount: bigint = pot.entryAmount;

    if (!address) {
      try {
        await ensureConnection();
      } catch {
        toast.error("Failed to connect wallet");
        return;
      }
      return;
    }

    const hasJoinedRound: boolean =
      isConnected && !!address && pot.participants.includes(address);

    if (hasJoinedRound) {
      toast.error("You have already joined this pot");
      return;
    }

    const isRoundZero: boolean = pot.round === 0;

    if (!isRoundZero) {
      setJoiningPotId(potId);
      let hasJoinedBefore: boolean | null = null;
      try {
        hasJoinedBefore = await getHasJoinedRound(pot.id, 0, address);
      } catch (e) {
        toast.error("Failed to check if user has joined pot");
        return;
      }
      if (!hasJoinedBefore) {
        toast.error(
          `Round ${1 + pot.round} has already started. You cannot join this pot`
        );
        return;
      }
    }

    if (tokenAllowance === undefined) {
      toast.error("Unable to fetch token token allowance. Please try again");
      return;
    }

    if (tokenBalance === undefined) {
      toast.error("Unable to fetch token balance. Please try again");
      return;
    }

    const fee = calculateJoineeFee(pot.maxParticipants);

    if (fee === undefined) {
      toast.error("Unable to fetch platform fee. Please try again");
      return;
    }

    if (dataNativeBalance === undefined) {
      toast.error("Unable to fetch native balance. Please try again");
      return;
    }

    if (fee.value > dataNativeBalance.value) {
      toast.error(
        `You do not have ${fee.formatted} ${dataNativeBalance.symbol} to join this pot. Balance: ${dataNativeBalance.valueFormattedSym}`
      );
      return;
    }

    if (entryAmount > tokenBalance) {
      toast.error("You do not have enough USDC");
      return;
    }

    setJoiningPotId(potId);

    try {
      setJoinedPotId(null);

      if (pot.round === 0) {
        const approveAmount = entryAmount * BigInt(pot.maxParticipants);
        await approveTokens(tokenAllowance + approveAmount);
        await refetchTokenAllowance();
      }

      await joinPot(potId, fee.value);
      setJoinedPotId(potId);

      toast.success(`Successfully joined pot #${potId}`);
    } catch (error: unknown) {
      toast.error("Failed to join pot", {
        description:
          error instanceof Error
            ? error.message?.split(".")?.[0]
            : "Something went wrong. Please try again",
      });
    } finally {
      setJoiningPotId(null);
    }
  };

  return {
    joinedPotId,
    joiningPotId,
    handleJoinPot,
    isLoading,
    tokenBalance,
    DisclaimerModal,
  };
}
