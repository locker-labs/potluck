'use client';

import YourPots from '../sections/YourPots';
import PotList from '../sections/PotList';
import Hero from '../sections/Hero';
import { useAccount } from 'wagmi';
import { AnimatePresence } from 'motion/react';

export default function HomePage() {
  const { isConnected, address } = useAccount();
  return (
    <div>
      <AnimatePresence>
        {isConnected && !!address ? <YourPots /> : null}
      </AnimatePresence>
      <Hero />
      <PotList />
    </div>
  );
}
