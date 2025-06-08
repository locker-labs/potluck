import { createPublicClient, http } from 'viem';
import { chain } from '@/config';

export const publicClient = createPublicClient({
  chain: chain,
  transport: http(`${process.env.NEXT_PUBLIC_BASE_RPC_URL}`),
});
