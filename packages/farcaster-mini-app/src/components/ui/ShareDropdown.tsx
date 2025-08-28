'use client';

import { Link as LinkIcon, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useCopyInviteLink } from '@/hooks/useCopyInviteLink';
import { useCreateCast } from '@/hooks/useCreateCast';
import type { TPotObject } from '@/lib/types';
import ShareButton from '../subcomponents/ShareButton';

type ShareDropdownProps = {
  pot: TPotObject;
  className?: string;
};

export function ShareDropdown({ pot, className = '' }: ShareDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { handleCopyLink } = useCopyInviteLink({ potId: pot.id });
  const { handleCastOnFarcaster } = useCreateCast({
    potId: pot.id,
    amount: pot.entryAmount,
    period: pot.period,
  });

  return (
    <div className={`relative inline-block text-left bg-transparent ${className}`}>
      <ShareButton onClick={() => setIsOpen(!isOpen)} />

      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
              }
            }}
            role='button'
            tabIndex={0}
            aria-label='Close menu'
          />
          <div
            className={`absolute right-0 z-50 mt-2 w-48 origin-top-right
            outline
            outline-1 outline-app-light
            focus:outline-2 focus:outline-app-cyan
            bg-app-dark focus:bg-app-dark active:bg-app-dark  
            rounded-xl
            shadow-lg ring-1 ring-black ring-opacity-5
            focus:outline-none---
            `}
          >
            <div className='py-1'>
              <button
                type='button'
                onClick={(e) => {
                  e.preventDefault();
                  handleCopyLink();
                  setIsOpen(false);
                }}
                className='flex w-full items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-800'
              >
                <LinkIcon className='mr-3 h-4 w-4' />
                Copy invite link
              </button>
              <hr className='border-0.5 border-gray-500' />
              <button
                type='button'
                onClick={() => {
                  handleCastOnFarcaster();
                  setIsOpen(false);
                }}
                className='flex w-full items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-800'
              >
                <MessageSquare className='mr-3 h-4 w-4' />
                Cast on Farcaster
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
