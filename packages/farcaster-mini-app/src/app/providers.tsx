'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { FrameProvider } from '@/components/providers/FrameProvider';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/components/AppLayout';

const WagmiProvider = dynamic(() => import('@/components/providers/WagmiProvider'), {
  ssr: false,
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider>
      <FrameProvider>
        <AppLayout>{children}</AppLayout>
        <Toaster position='bottom-right' />
      </FrameProvider>
    </WagmiProvider>
  );
}
