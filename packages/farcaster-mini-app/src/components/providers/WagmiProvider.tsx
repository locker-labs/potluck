import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

import { WagmiProvider } from 'wagmi';
import { appKitNetwork } from '@/config';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type React from 'react';

const queryClient = new QueryClient();

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_APP_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_APP_ID is not defined');
}

export const wagmiAdapter = new WagmiAdapter({
  connectors: [farcasterFrame()],
  projectId,
  networks: [appKitNetwork],
});

export const config = wagmiAdapter.wagmiConfig;

// Initialize the app kit
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [appKitNetwork],
});

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
