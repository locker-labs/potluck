'use client';

import { generateRandomCast } from '@/lib/helpers/cast';
import { TrendingUp, CircleCheckBig, Loader2, UsersRound, MessageSquarePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { fetchPot, getPotParticipants, potMapper, getHasJoinedRound } from '@/lib/helpers/contract';
import type { TPotObject } from '@/lib/types/contract.type';
import { type Abi, formatUnits, GetFilterLogsReturnType } from 'viem';
import { useJoinPot } from '@/hooks/useJoinPot';
import { GradientButton2, GradientButton3 } from '../ui/Buttons';
import { GradientCard2 } from '../ui/GradientCard';
import { useSearchParams } from 'next/navigation';
import { getInviteLink } from '@/lib/helpers/inviteLink';
import { useConnection } from '@/hooks/useConnection';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { MoveLeft } from 'lucide-react';
import { timeFromNow } from '@/lib/helpers/time';
import { DurationPill } from '@/components/ui/Pill';
import Image from 'next/image';
import { truncateNumberString } from '@/lib/helpers/math';
import { getAllLogsForAPot } from '@/lib/getLogs';
import { RecentActivity } from '@/components/sections/RecentActivity';

const defaultLogsState = { loading: true, error: null, logs: [] };

export default function PotPage({ id }: { id: string }) {
  const router = useRouter();
  const potId = BigInt(id);
  const searchParams = useSearchParams();
  const joinSearchParam = searchParams.get('join');
  const autoJoin = joinSearchParam === '' || !!joinSearchParam;

  const { isConnected, address, isConnecting } = useAccount();
  const { ensureConnection } = useConnection();
  const { handleJoinPot, isLoading: isLoadingJoinPot, joiningPotId, tokenBalance } = useJoinPot();

  // STATES
  const [copied, setCopied] = useState(false);
  const [pot, setPot] = useState<TPotObject | null>(null);
  const [loadingPot, setLoadingPot] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState<boolean | null>(null);
  const [logsState, setLogsState] = useState<{
    loading: boolean;
    error: string | null;
    logs: GetFilterLogsReturnType<Abi>;
  }>(defaultLogsState);

  // EFFECTS
  // Load pot details on mount
  useEffect(() => {
    (async function loadPot() {
      setLoadingPot(true);
      setError(null);
      try {
        const [potRaw, potParticipants] = await Promise.all([
          fetchPot(potId),
          getPotParticipants(potId),
        ]);
        setPot(potMapper(potRaw, '0xdeadbeef', potParticipants));
      } catch {
        setError('Failed to load pot details');
      } finally {
        setLoadingPot(false);
      }
    })();
  }, [potId]);

  // Load pot logs on mount
  useEffect(() => {
    (async function loadPotLogs() {
      setLogsState(defaultLogsState);
      try {
        const allLogs: GetFilterLogsReturnType<Abi> = await getAllLogsForAPot(potId);
        console.log(`allLogs:${potId}`, allLogs);
        setLogsState((prev) => ({ ...prev, logs: allLogs }));
      } catch {
        setLogsState((prev) => ({ ...prev, error: 'Failed to load pot logs' }));
      } finally {
        setLogsState((prev) => ({ ...prev, loading: false }));
      }
    })();
  }, [potId]);

  // join pot from search param
  useEffect(() => {
    if (!isLoadingJoinPot && autoJoin && pot) {
      (async function handleAutoJoin() {
        if (isConnected && address) {
          await handleJoinPot(pot);
        } else {
          ensureConnection().then(() => {
            handleJoinPot(pot).catch((err) => {
              console.error('Failed to join pot:', err);
              toast.error('Failed to join pot');
            });
          });
        }
      })();
    }
  }, [autoJoin, pot, isLoadingJoinPot]);

  // Has user joined pot previously
  useEffect(() => {
    if (isConnected && address && !!pot) {
      (async () => {
        setHasJoinedBefore(await getHasJoinedRound(pot.id, pot.round, address));
      })();
    }
  }, [isConnected, address, pot]);

  // Handle copy invite link
  const handleCopyLink = async () => {
    if (potId === null) {
      toast.error('Pot ID is not available. Please create a pot first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(getInviteLink(potId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link');
    }
  };

  const handleCastOnFarcaster = () => {
    if (!potId) {
      toast.error('Pot ID is not available. Please create a pot first.');
      return;
    }
    const castText = generateRandomCast(
      Number(formatUnits(pot?.entryAmount ?? 0n, 6)),
      pot?.period ?? 0n,
      potId,
    );
    // Open Warpcast in a new tab with pre-filled message
    const warpcastUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(castText)}`;
    window.open(warpcastUrl, '_blank');
  };

  if (loadingPot) {
    return (
      <div className='flex items-center justify-center min-h-[calc(100vh-96px)]'>
        <Loader2 className='animate-spin text-gray-500' size={32} />
      </div>
    );
  }
  if (error || !pot) {
    return (
      <div className='flex items-center justify-center min-h-[300px]'>
        {error || 'Pot not found'}
      </div>
    );
  }

  // DERIVED STATE
  const isRoundZero: boolean = pot.round === 0;
  const isJoiningPot: boolean = joiningPotId !== null;
  const hasJoinedRound: boolean = isConnected && !!address && pot.participants.includes(address);
  const initialLoading: boolean = isLoadingJoinPot || loadingPot;
  const cannotJoinPot: boolean = !isRoundZero && !hasJoinedBefore;
  const insufficientBalance: boolean = tokenBalance === undefined || tokenBalance < pot.entryAmount;
  const deadlinePassed: boolean = pot.deadline < Math.floor(Date.now() / 1000);
  const completedContributions: number = hasJoinedRound ? 1 + pot.round : pot.round;

  const disabled: boolean =
    isJoiningPot ||
    hasJoinedRound ||
    initialLoading ||
    cannotJoinPot ||
    insufficientBalance ||
    deadlinePassed;
  const joinButtonText = hasJoinedRound ? (
    'Joined'
  ) : isJoiningPot ? (
    'Joining...'
  ) : deadlinePassed ? (
    'Pot Expired ⌛'
  ) : insufficientBalance ? (
    'Insufficient Balance 💰'
  ) : isRoundZero ? (
    'Join Pot'
  ) : hasJoinedBefore ? (
    <span className={'flex items-center'}>
      <span className={'leading-none'}>Pay This Round (</span>
      <span className={'mr-1'}>
        <Image src={'/usd-coin-usdc-logo-24x24.png'} alt={'usdc-logo'} width={16} height={16} />
      </span>
      <span className={'leading-none'}>{formatUnits(pot.entryAmount, 6)})</span>
    </span>
  ) : (
    'Cannot Join 😔'
  );

  return (
    <div>
      <div className='w-full flex items-center justify-between gap-4 mb-8'>
        <div className='flex items-cener justify-center gap-4'>
          <GradientButton3
            onClick={() => router.push('/')}
            className='text-sm h-9 flex items-center rounded-[10px]'
          >
            <MoveLeft size={20} />
          </GradientButton3>
          <div className='w-full whitespace-nowrap'>
            <p className='text-2xl font-bold'>{pot.name}</p>
          </div>
        </div>
        {hasJoinedBefore || hasJoinedRound ? (
          <div className='bg-green-500/30 text-green-500 h-[24px] px-[10px] flex items-center justify-center rounded-[10px] border border-green-500'>
            <p className='text-xs font-light'>joined</p>
          </div>
        ) : null}
      </div>

      <GradientCard2 className='w-full mt-4 pb-4'>
        <div>
          <div className='flex'>
            <DurationPill
              text={
                deadlinePassed
                  ? 'Awaiting payout'
                  : `Next draw in: ${timeFromNow(Number(pot.deadline))}`
              }
            />
          </div>
        </div>

        <div className='grid grid-cols-3'>
          <div className='col-start-3 text-end'>
            <p className='text-cyan-400 font-bold text-[28px] leading-none'>${pot.totalPool}</p>
            <p className='text-[13px] font-light leading-relaxed'>Total Pool</p>
          </div>
        </div>

        <div className='mt-2 grid grid-cols-3'>
          <div className='flex items-center justify-start gap-1'>
            <UsersRound strokeWidth='1.25px' size={18} color='#14b6d3' />
            <span className='font-base text-[14px]'>
              {isRoundZero
                ? String(pot.totalParticipants)
                : `${String(pot.participants.length)}/${String(pot.totalParticipants)}`}
            </span>
          </div>
          <p className='font-base text-[14px]'>
            ${formatUnits(pot.entryAmount, 6)} {pot.periodString}
          </p>
          <div className={'flex items-center justify-end gap-1'}>
            <Image src={'/usd-coin-usdc-logo-24x24.png'} alt={'usdc-logo'} width={16} height={16} />
            <p className={'text-sm'}>{truncateNumberString(formatUnits(tokenBalance ?? 0n, 6))}</p>
          </div>
        </div>

        {/* User contribution progress bar */}
        <p className={'mt-4 text-xs text-white/80 leading-none'}>
          {completedContributions}/{pot.totalParticipants} contribution
          {pot.totalParticipants > 1 ? 's' : ''} complete
        </p>
        <div className='mt-1 w-full h-2 bg-[#2d0046] rounded-full'>
          <div
            style={{
              width: `${Math.trunc((100 * completedContributions) / pot.totalParticipants)}%`,
            }}
            className={'rounded-full h-2 bg-green-500'}
          />
        </div>

        {!isConnected || !address ? (
          // Connect Wallet Button
          <GradientButton2
            isActive={true}
            className='w-full h-[35px] flex items-center justify-center mt-3 mx-auto shadow-lg hover:shadow-xl transition-all duration-300 text-base font-bold rounded-xl'
            onClick={(e) => {
              e.preventDefault();
              ensureConnection()
                .then(() => {})
                .catch(() => {});
            }}
            disabled={false}
          >
            {isConnecting ? 'Connecting' : 'Connect'}
          </GradientButton2>
        ) : (
          // Join Pot Button
          <GradientButton2
            isActive={true}
            className='w-full h-[35px] flex items-center justify-center mt-3 mx-auto shadow-lg hover:shadow-xl transition-all duration-300 text-base font-bold rounded-xl'
            onClick={(e) => {
              e.preventDefault();
              handleJoinPot(pot)
                .then(() => {})
                .catch(() => {});
            }}
            disabled={disabled}
          >
            {joinButtonText}
          </GradientButton2>
        )}
      </GradientCard2>

      <div className='mt-4 grid grid-cols-3 gap-4'>
        <div
          className={`
          max-w-full mx-auto py-3 transition-colors
          rounded-[12px] bg-app-cyan/20 border border-app-cyan
          disabled:text-gray-100
          text-gray-400 shadow-md
          w-full flex flex-col items-center justify-center
          `}
        >
          <p className='font-bold text-2xl'>{1 + pot.round}</p>
          <p className='text-sm'>Total Rounds</p>
        </div>
        <div
          className={`
          max-w-full mx-auto py-3 transition-colors
          rounded-[12px] bg-app-cyan/20 border border-app-cyan
          disabled:text-gray-100
          text-gray-400 shadow-md
          w-full flex flex-col items-center justify-center
          `}
        >
          <p className='font-bold text-2xl'>${Number(pot.totalPool) * pot.round}</p>
          <p className='text-sm'>Total Won</p>
        </div>
        <div
          className={`
          max-w-full mx-auto py-3 transition-colors
          rounded-[12px] bg-app-cyan/20 border border-app-cyan
          disabled:text-gray-100
          text-gray-400 shadow-md
          w-full flex flex-col items-center justify-center
          `}
        >
          <p className='font-bold text-2xl'>-</p>
          <p className='text-sm'>Reputation</p>
        </div>
      </div>

      <div className='mt-4 gap-3 grid grid-cols-2'>
        <GradientButton3
          className='w-full flex items-center justify-center gap-2'
          onClick={handleCopyLink}
        >
          {copied ? <CircleCheckBig size={18} /> : <Copy size={18} />}
          <p>{copied ? 'Copied!' : 'Invite Link'}</p>
        </GradientButton3>

        <GradientButton3
          className='w-full flex items-center justify-center gap-2'
          onClick={handleCastOnFarcaster}
        >
          <MessageSquarePlus size={18} />
          <p>Cast</p>
        </GradientButton3>
      </div>

      <div className='mt-4 border border-gray-500 pt-6 rounded-xl'>
        <div className='flex items-center gap-2 px-4'>
          <TrendingUp strokeWidth='2px' size={18} color='#14b6d3' />
          <p>Recent Activities</p>
        </div>
        <hr className='mt-2 border-gray-500' />
        <RecentActivity logsState={logsState} pot={pot} />
      </div>
    </div>
  );
}
