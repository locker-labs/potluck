'use client';

import { AnimatePresence } from 'motion/react';
import { useAccount } from 'wagmi';
import YourPots from '@/components/sections/YourPots';
import AvailablePots from '@/components/sections/AvailablePots';
import Hero from '@/components/sections/Hero';

export default function HomePage() {
  const { isConnected, address } = useAccount();
  return (
    <div>
      <AnimatePresence>
        {isConnected && !!address ? <YourPots /> : null}
      </AnimatePresence>
      <Hero />
      <AvailablePots />
    </div>
  );
}
