import { publicClient } from '@/clients/viem';
import { contractAddress, abi, tokenAddress, PotCreatedEventSignatureHash } from '@/config';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { useApproveTokens } from '@/hooks/useApproveTokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useConnection } from '@/hooks/useConnection';
import { type Address, toHex } from 'viem';
import { emptyBytes32 } from '@/lib/helpers/contract';

let _potName: string;
let _amount: bigint;
let _timePeriod: bigint;

export function useCreatePot() {
  const [isCreatingPot, setIsCreatingPot] = useState(false);
  const [potId, setPotId] = useState<bigint | null>(null);
  const [hash, setHash] = useState<Address | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  const { ensureConnection } = useConnection();
  const { data: tokenBalance, isLoading: isLoadingBalance } = useTokenBalance();
  const { allowance, isLoadingAllowance, approveTokensAsync, refetchAllowance } =
    useApproveTokens();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const isLoading: boolean = isLoadingBalance || isLoadingAllowance;

  const createPot = async (
    potName: string,
    amountBigInt: bigint,
    timePeriod: bigint,
  ): Promise<bigint> => {
    try {
      const args = [toHex(potName), tokenAddress, amountBigInt, timePeriod, emptyBytes32];
      console.log('Creating pot with args:', {
        potName,
        tokenAddress,
        amount: amountBigInt.toString(),
        timePeriod: timePeriod.toString(),
        fee: toHex(0),
      });
      // broadcast transaction
      const txHash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: 'createPot',
        args,
      });

      // wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });

      if (receipt.status === 'reverted') {
        throw new Error(`Transaction reverted: ${getTransactionLink(receipt.transactionHash)}`);
      }

      console.log(`Transaction confirmed: ${getTransactionLink(receipt.transactionHash)}`);

      // parse logs to get pot ID
      const potCreatedEvent = receipt.logs.find(
        (log) => log.topics[0] === PotCreatedEventSignatureHash,
      );
      if (!potCreatedEvent) {
        throw new Error('PotCreated event not found in transaction logs');
      }

      const id = BigInt(potCreatedEvent.topics[1] ?? '0');
      setHash(txHash);
      setPotId(id);
      return id;
    } catch (error) {
      console.error('Error creating potluck:', error);
      throw error;
    }
  };

  const handleCreatePot = async (potName: string, amount: bigint, timePeriod: bigint) => {
    _potName = potName;
    _amount = amount;
    _timePeriod = timePeriod;

    setPotId(null);

    if (!address) {
      try {
        await ensureConnection();
      } catch {
        console.error('Failed to connect wallet:');
        toast.error('Failed to connect wallet');
        return;
      }
      setIsPending(true);
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

    if (amount > tokenBalance) {
      toast.error('You do not have enough USDC.');
      return;
    }

    setIsCreatingPot(true);

    try {
      if (4n * amount > BigInt(allowance)) {
        await approveTokensAsync(4n * amount);
        await refetchAllowance();
      }

      await createPot(potName, amount, timePeriod);
    } catch (error) {
      console.error('Error creating potluck:', error);
      toast.error('Error creating potluck', {
        description:
          error instanceof Error
            ? error.message?.split('.')?.[0]
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsCreatingPot(false);
    }
  };

  useEffect(() => {
    if (isPending && allowance !== undefined && tokenBalance !== undefined) {
      handleCreatePot(_potName, _amount, _timePeriod).then().catch();
      setIsPending(false);
    }
  }, [isPending, allowance, tokenBalance]);

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
  };
}
