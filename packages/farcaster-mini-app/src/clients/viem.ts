import { createPublicClient, http } from 'viem'
import { chain } from '@/config'
 
export const publicClient = createPublicClient({
  chain: chain,
  transport: http(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
})