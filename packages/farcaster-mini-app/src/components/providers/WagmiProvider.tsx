import { createConfig, http, WagmiProvider } from 'wagmi';
import { chain } from '@/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { metaMask } from 'wagmi/connectors';
import { APP_NAME, APP_URL, RPC_URL } from '@/lib/constants';
import type React from 'react';

export const config = createConfig({
  chains: [chain],
  transports: {
    [chain.id]: http(RPC_URL),
  },
  connectors: [
    farcasterFrame(),
    metaMask({
      dappMetadata: {
        name: APP_NAME,
        url: APP_URL,
      },
    }),
  ],
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
