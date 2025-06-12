'use client';

import YourPots from '../sections/YourPots';
import PotList from '../sections/PotList';
import Hero from '../sections/Hero';

export default function HomePage() {
  return (
    <div>
      <YourPots />
      <Hero />
      <PotList />
    </div>
  );
}
