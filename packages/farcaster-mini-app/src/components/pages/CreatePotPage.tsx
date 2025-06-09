'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { parseUnits, toHex } from 'viem';
import { useWriteContract, useAccount } from 'wagmi';
import { MoveLeft, Copy, MessageSquarePlus, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { formatAddress } from '@/lib/address';
import { useApproveTokens } from '@/hooks/useApproveTokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { contractAddress, abi, tokenAddress, PotCreatedEventSignatureHash } from '@/config';
import { publicClient } from '@/clients/viem';
import { generateRandomCast } from '@/lib/helpers/cast';
import { GradientButton, GradientButton3 } from '../ui/Buttons';
import { getInviteLink } from '@/lib/helpers/inviteLink';
import { useConnection } from '@/hooks/useConnection';
import { emptyBytes32 } from '@/lib/helpers/contract';

const emojis = ['🎯', '🏆', '🔥', '🚀', '💪', '⚡', '🎬', '🎓', '🍕', '☕'];

const timePeriods = [
  { value: BigInt(86400), label: 'Daily' },
  { value: BigInt(604800), label: 'Weekly' },
  // { value: BigInt(1209600), label: "Biweekly" },
  { value: BigInt(2592000), label: 'Monthly' },
];

let potId: bigint | null = null;

export default function CreatePotPage() {
  const [emoji, setEmoji] = useState<string>(emojis[0]);
  const [name, setName] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<bigint>(timePeriods[0].value);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const router = useRouter();
  const { isConnected } = useAccount();
  const { ensureConnection } = useConnection();
  const { data: hash, isPending, writeContractAsync } = useWriteContract();
  const { data: tokenBalanceBigInt, isLoading: isLoadingBalance } = useTokenBalance();
  const { allowance, isLoadingAllowance, refetchAllowance, approveTokensAsync } =
    useApproveTokens();

  const potName = `${emoji} ${name.trim()}`;
  const amountBigInt = BigInt(parseUnits(amount, 6));
  const allowanceBigInt = BigInt(allowance ?? 0);

  const initialLoading = isLoadingAllowance || isLoadingBalance;
  const isLoading = isSubmitting || isPending;
  const disabled =
    !isConnected ||
    initialLoading ||
    isLoading ||
    !amount ||
    !name ||
    Number.parseFloat(amount) <= 0;

  // FUNCTIONS

  const createPot = async (): Promise<bigint> => {
    try {
      const args = [toHex(potName), tokenAddress, amountBigInt, timePeriod, emptyBytes32];
      console.log('Creating pot with args:', {
        potName,
        tokenAddress,
        amount: amountBigInt.toString(),
        timePeriod: timePeriod.toString(),
        fee: toHex(0),
      });
      // broadcast transaction
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName: 'createPot',
        args,
      });

      // wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

      if (receipt.status === 'reverted') {
        throw new Error(
          `Transaction reverted: https://sepolia.basescan.org/tx/${receipt.transactionHash}`,
        );
      }

      console.log('Transaction confirmed:', receipt);

      // parse logs to get pot ID
      const potCreatedEvent = receipt.logs.find(
        (log) => log.topics[0] === PotCreatedEventSignatureHash,
      );
      if (!potCreatedEvent) {
        throw new Error('PotCreated event not found in transaction logs');
      }

      potId = BigInt(potCreatedEvent.topics[1] ?? '0');

      return potId;
    } catch (error) {
      console.error('Error creating potluck:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.warning('Invalid amount', {
        description: 'Please enter a valid USDC amount greater than 0.',
      });
      return;
    }

    if (tokenBalanceBigInt === undefined) {
      toast.error('Error fetching token balance', {
        description: 'Unable to fetch your USDC balance. Please try again later.',
      });
      return;
    }

    if (amountBigInt > tokenBalanceBigInt) {
      toast.error('Insufficient balance', {
        description: 'You do not have enough USDC to create this pot.',
      });
      return;
    }

    setIsSubmitting(true);

    await ensureConnection();

    try {
      if (4n * amountBigInt > allowanceBigInt) {
        await approveTokensAsync(4n * amountBigInt);
      }

      await createPot();

      // Show success modal instead of toast
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating potluck:', error);
      toast.error('Error creating potluck', {
        description:
          error instanceof Error
            ? error.message?.split('.')?.[0]
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle copy invite link
  const handleCopyLink = async () => {
    if (potId === null) {
      toast.error('Pot ID is not available. Please create a pot first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(getInviteLink(potId));
      toast.success('Invite link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link');
    }
  };

  // Handle casting to Farcaster
  const handleCastOnFarcaster = () => {
    if (!potId) {
      toast.error('Pot ID is not available. Please create a pot first.');
      return;
    }
    const castText = generateRandomCast(Number(amount), timePeriod, potId);
    // Open Warpcast in a new tab with pre-filled message
    const warpcastUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(castText)}`;
    window.open(warpcastUrl, '_blank');
  };

  // EFFECTS
  useEffect(() => {
    refetchAllowance();
  }, [isSubmitting]);

  // Redirect to pot page when success modal is closed
  useEffect(() => {
    if (!showSuccessModal && potId) {
      router.push(`/pot/${potId}`);
      potId = null;
    }
  }, [showSuccessModal]);

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

          {isConnected ? (
            <GradientButton type='submit' className='w-full' disabled={disabled}>
              {initialLoading ? 'Loading...' : isLoading ? 'Launching...' : 'Launch Pot'}
            </GradientButton>
          ) : (
            <GradientButton
              onClick={(e) => {
                e.preventDefault();
                ensureConnection();
              }}
              type='button'
              className='w-full'
            >
              Connect
            </GradientButton>
          )}
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
                    <Link href={`https://sepolia.basescan.org/tx/${hash}`}>
                      {formatAddress(hash)}
                    </Link>
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
