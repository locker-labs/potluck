'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { parseUnits } from 'viem';
import { MoveLeft, Copy, MessageSquarePlus, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { formatAddress } from '@/lib/address';
import { GradientButton, GradientButton3 } from '../ui/Buttons';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useCreatePot } from '@/hooks/useCreatePot';
import { useCopyInviteLink } from '@/hooks/useCopyInviteLink';
import { useCreateCast } from '@/hooks/useCreateCast';

const emojis = ['🎯', '🏆', '🔥', '🚀', '💪', '⚡', '🎬', '🎓', '🍕', '☕'];

const timePeriods = [
  { value: BigInt(86400), label: 'Daily' },
  { value: BigInt(604800), label: 'Weekly' },
  { value: BigInt(2592000), label: 'Monthly' },
];

export default function CreatePotPage() {
  const [emoji, setEmoji] = useState<string>(emojis[0]);
  const [name, setName] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<bigint>(timePeriods[0].value);
  const [amount, setAmount] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const potName = `${emoji} ${name.trim()}`;
  const amountBigInt = BigInt(parseUnits(amount, 6));

  const router = useRouter();
  const { potId, setPotId, handleCreatePot, isCreatingPot, isLoading, hash } = useCreatePot();
  const { handleCopyLink } = useCopyInviteLink({ potId: potId });
  const { handleCastOnFarcaster } = useCreateCast({
    potId,
    amount: amountBigInt,
    period: timePeriod,
  });

  const disabled = isLoading || isCreatingPot || !amount || !name || Number.parseFloat(amount) <= 0;

  // FUNCTIONS
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleCreatePot(potName, amountBigInt, timePeriod);
  };

  // EFFECTS
  // Redirect to pot page when success modal is closed
  useEffect(() => {
    if (!showSuccessModal && potId) {
      router.push(`/pot/${potId}`);
      setPotId(null);
    }
  }, [showSuccessModal]);

  // Show success modal when pot is created
  useEffect(() => {
    if (!!hash && !!potId) {
      setShowSuccessModal(true);
    }
  }, [hash, potId]);

  return (
    <div>
      <div>
        <div className='w-full flex items-center justify-start gap-4 mb-8'>
          <GradientButton3 onClick={() => router.push('/')} className='text-sm'>
            <MoveLeft size={20} />
          </GradientButton3>
          <div className='w-full'>
            <p className='text-2xl font-bold'>Create Pot</p>
            <p className='text-sm font-light'>Set up your community pot in minutes</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Name */}
          <div>
            <label htmlFor='pot-name' className='block text-sm font-bold mb-1'>
              Pot Name
            </label>
            <Input
              id='pot-name'
              name='pot-name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='DeFi Warriors'
            />
          </div>

          {/* Choose Emoji */}
          <div>
            <label htmlFor='choose-emoji' className='block text-sm font-bold mb-1'>
              Choose Emoji
            </label>
            <div className='grid grid-cols-5 gap-2'>
              {emojis.map((emojiOption) => (
                <button
                  key={emojiOption}
                  type='button'
                  className={`p-2 inline-flex items-center justify-center text-2xl rounded-2xl transition-colors ${emoji === emojiOption ? 'bg-app-cyan/20 border border-app-cyan outline outline-1 outline-app-cyan' : 'bg-app-dark border border-app-light'}`}
                  onClick={() => setEmoji(emojiOption)}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Amount */}
          <div>
            <label htmlFor='enrty-amount' className='block text-sm font-bold mb-1'>
              Individual Contribution Amount
            </label>
            <Input
              id='enrty-amount'
              type='number'
              min='0.01'
              step='0.01'
              value={amount}
              onChange={(e) => {
                // Prevent negative values
                const value = e.target.value;
                if (value === '' || Number.parseFloat(value) >= 0) {
                  setAmount(value);
                }
              }}
              onKeyDown={(e) => {
                // Prevent typing minus sign
                if (e.key === '-' || e.key === 'e') {
                  e.preventDefault();
                }
              }}
              placeholder='0.00'
              className='w-full'
            />
          </div>

          {/* Choose Time Period */}
          <div>
            <label htmlFor='time-period' className='block text-sm font-bold mb-1'>
              Frequency
            </label>
            <div className='grid grid-cols-3 gap-2.5'>
              {timePeriods.map((period) => (
                <button
                  key={period.value}
                  type='button'
                  className={`w-full p-2 flex items-center justify-center text-base font-bold rounded-lg transition-colors outline ${period.value === timePeriod ? 'bg-app-cyan/20 outline-2 outline-app-cyan' : 'bg-app-dark outline-1 outline-app-light'}`}
                  onClick={() => setTimePeriod(period.value)}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <GradientButton type='submit' className='w-full' disabled={disabled}>
            <span className={'flex items-center justify-center gap-2'}>
              <span>{isLoading ? 'Loading' : 'Create'}</span>
              {isLoading || isCreatingPot ? (
                <Loader2 className='animate-spin h-5 w-5 text-white' size={20} />
              ) : null}
            </span>
          </GradientButton>
        </form>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className='sm:max-w-md rounded-2xl'>
          <DialogHeader>
            <DialogTitle className='text-center text-2xl font-bold'>
              Congratulations! 🎉
            </DialogTitle>
            <DialogDescription className='text-center'>
              <div className='py-4'>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Check className='h-8 w-8 text-green-500' />
                </div>
                <h3 className='text-xl font-bold mb-2'>Your potluck has been created!</h3>
                <p className='mb-6'>
                  Share with friends to start saving together. The more people that join, the more
                  everyone saves!
                </p>
                {hash && (
                  <div>
                    Transaction Hash:{' '}
                    <Link href={getTransactionLink(hash)}>{formatAddress(hash)}</Link>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 mt-2'>
            <GradientButton3
              className='w-full flex items-center justify-center gap-2'
              onClick={handleCastOnFarcaster}
            >
              <MessageSquarePlus size={18} />
              Cast on Farcaster
            </GradientButton3>

            <GradientButton3
              className='w-full flex items-center justify-center gap-2'
              onClick={handleCopyLink}
            >
              <Copy size={18} />
              Copy Invite Link
            </GradientButton3>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
