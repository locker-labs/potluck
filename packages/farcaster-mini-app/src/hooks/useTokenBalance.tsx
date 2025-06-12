// hooks/useTokenBalance.ts
import { erc20Abi, type Address } from 'viem';
import { useReadContract, useAccount } from 'wagmi';
import { tokenAddress } from '@/config';

export const useTokenBalance = () => {
  const { address: accountAddress } = useAccount();

  return useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: 'balanceOf',
    args: [accountAddress as Address],
    query: { enabled: !!accountAddress },
  });
};
