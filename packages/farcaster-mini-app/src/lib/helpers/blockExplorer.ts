import { chainId } from '@/config';

const chainIdToBlockExplorer: Record<number, string> = {
  8453: 'https://basescan.org',
  84532: 'https://sepolia.basescan.org',
};

export const getTransactionLink = (txHash: string): string => {
  return `${chainIdToBlockExplorer[chainId]}/tx/${txHash}`;
};

export const getAddressLink = (address: string): string => {
  return `${chainIdToBlockExplorer[chainId]}/address/${address}`;
};
