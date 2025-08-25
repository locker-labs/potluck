import type { ReactNode } from 'react';

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex bg-cyan-500/20 py-1 px-2 rounded-full gap-1.5 items-center ${className}`}>
      {children}
    </div>
  );
}