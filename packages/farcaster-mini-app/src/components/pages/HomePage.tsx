'use client';

import { AnimatePresence } from 'motion/react';
import { useAccount } from 'wagmi';
import YourPots from '@/components/sections/YourPots';
import AvailablePots from '@/components/sections/AvailablePots';
import Hero from '@/components/sections/Hero';
import { motion } from 'motion/react';
import { animate, initialUp, transition } from "@/lib/pageTransition";

export default function HomePage() {
  const { isConnected, address } = useAccount();
  return (
    <motion.div
        initial={initialUp}
        animate={animate}
        transition={transition}
    >
      <AnimatePresence>
        {isConnected && !!address ? <YourPots type='joined' /> : null}
      </AnimatePresence>
        <div className={'px-4'}>
          <Hero />
        </div>
        <div className={'mt-6 px-4'}>
          <AvailablePots />
        </div>
      </motion.div>
  );
}
