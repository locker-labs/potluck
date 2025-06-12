import { createPublicClient, http } from 'viem';
import { chain } from '@/config';
import { RPC_URL } from '@/lib/constants';

export const publicClient = createPublicClient({
  chain: chain,
  transport: http(RPC_URL),
});
