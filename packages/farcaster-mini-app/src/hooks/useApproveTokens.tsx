import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { toast } from 'sonner';
import { tokenAddress, contractAddress } from '@/config';
import { erc20Abi, type Address } from 'viem';

export function useApproveTokens() {
  const { address, isConnected } = useAccount();

  const { writeContractAsync, isPending: isApproving } = useWriteContract();

  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address as Address, contractAddress],
  });

  const approveTokensAsync = async (amountBigInt: bigint) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      toast.info('approve tokens');
      await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [contractAddress, amountBigInt],
      });
      console.log('Approved successfully');
    } catch (error) {
      console.error('Approval failed:', error);
      throw error;
    } finally {
      setTimeout(() => {
        refetchAllowance();
        toast.dismiss();
      }, 1000);
    }
  };

  return { allowance, isLoadingAllowance, refetchAllowance, approveTokensAsync, isApproving };
}
