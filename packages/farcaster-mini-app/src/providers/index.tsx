'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { FrameProvider } from '@/providers/FrameProvider';
import { PotluckProvider } from '@/providers/PotluckProvider';

const WagmiProvider = dynamic(() => import('@/providers/WagmiProvider'), {
  ssr: false,
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider>
      <FrameProvider>
        <PotluckProvider>
          {children}
        </PotluckProvider>
      </FrameProvider>
    </WagmiProvider>
  );
}
