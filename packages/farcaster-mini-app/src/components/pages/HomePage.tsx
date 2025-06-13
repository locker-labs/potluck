'use client';

import YourPots from '../sections/YourPots';
import PotList from '../sections/PotList';
import Hero from '../sections/Hero';
import { useAccount } from 'wagmi';

export default function HomePage() {
  const { isConnected, address } = useAccount();
  return (
    <div>
      {isConnected && !!address ? <YourPots /> : null}
      <Hero />
      <PotList />
    </div>
  );
}
