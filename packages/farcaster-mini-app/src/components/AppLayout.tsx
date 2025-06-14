'use client';

import type { ReactNode } from 'react';
import NavBar from './NavBar';
import { useConnection } from '@/hooks/useConnection';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  useConnection();
  return (
    <div className='min-h-screen bg-gradient-to-tl from-app-purple to-app-gray text-white'>
      <NavBar />
      <main className='pt-[72px] px-4 pb-6 w-full'>{children}</main>
    </div>
  );
}
