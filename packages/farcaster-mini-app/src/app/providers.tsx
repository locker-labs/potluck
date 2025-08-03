'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { FrameProvider } from '@/components/providers/FrameProvider';

const WagmiProvider = dynamic(() => import('@/components/providers/WagmiProvider'), {
  ssr: false,
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider>
      <FrameProvider>
        {children}
      </FrameProvider>
    </WagmiProvider>
  );
}
