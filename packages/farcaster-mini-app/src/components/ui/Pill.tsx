import type { ReactNode } from 'react';
import { Clock5 } from 'lucide-react';

export function Pill({ children }: { children: ReactNode }) {
  return (
    <div className='flex bg-cyan-500/20 py-1 px-2 rounded-full gap-1.5 items-center'>
      {children}
    </div>
  );
}

export function DurationPill({ text, className }: { text: string; className?: string }) {
  return (
    <Pill>
      <Clock5 size={14} className='text-cyan-400' />
      <p className={`text-xs font-bold text-cyan-400 ${className}`}>{text}</p>
    </Pill>
  );
}
