'use client';

import { AnimatePresence } from 'motion/react';
import { useAccount } from 'wagmi';
import YourPots from '@/components/sections/YourPots';
import AvailablePots from '@/components/sections/AvailablePots';
import Hero from '@/components/sections/Hero';
import { motion } from 'motion/react';
import { animate, initialUp, transition } from "@/lib/pageTransition";
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { MotionButton } from '../ui/Buttons';

function WelcomeDialog({
	open,
	onOpenChange,
}: { open: boolean; onOpenChange: (open: boolean) => void }) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='rounded-2xl w-md max-w-[calc(100vw-32px)]' showClose={false}>
				<DialogHeader>
					<DialogTitle className="text-white">Welcome to Potluck!</DialogTitle>
				</DialogHeader>
				<div className="mb-4 text-gray-200">
					<p>
						Potluck lets you pool money into pots with friends. Connect your wallet to get started. Join available
						pots, or create your own.
					</p>
				</div>
				<DialogFooter>
					<MotionButton onClick={() => onOpenChange(false)}>
						Got it!
					</MotionButton>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function HomePage() {
  const { isConnected, address } = useAccount();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('potluck_has_seen_welcome');
    if (!hasSeenWelcome) {
      setShowDialog(true);
      localStorage.setItem('potluck_has_seen_welcome', 'true');
    }
  }, []);

  return (
    <motion.div
        initial={initialUp}
        animate={animate}
        transition={transition}
    >
      <WelcomeDialog open={showDialog} onOpenChange={setShowDialog} />
      <AnimatePresence>
        {isConnected && !!address ? <YourPots type='joined' /> : null}
      </AnimatePresence>
        <div className={'mt-6 px-4'}>
          <Hero />
        </div>
        <div className={'mt-6 px-4'}>
          <AvailablePots />
        </div>
      </motion.div>
  );
}
