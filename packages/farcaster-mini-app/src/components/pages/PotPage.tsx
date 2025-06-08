"use client";

import { generateRandomCast } from "@/lib/helpers/cast";
import { MoveUpRight, TrendingUp, CircleCheckBig, Loader2, Clock5, UsersRound, MessageSquarePlus } from 'lucide-react'
import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { fetchPot, getPotParticipants, potMapper } from '@/lib/helpers/contract';
import type { TPotObject } from '@/lib/types/contract.type';
import { formatUnits } from "viem";
import { useJoinPot } from "@/hooks/useJoinPot";
import { GradientButton } from "../ui/GradientButton";
import { GradientCard2 } from "../ui/GradientCard";
import { useSearchParams } from 'next/navigation';
import { getInviteLink } from "@/lib/helpers/inviteLink";
import { useConnection } from '@/hooks/useConnection';
import { useAccount } from "wagmi";
import { GradientButton3 } from '../ui/GradientButton3';
import { useRouter } from 'next/navigation';
import { MoveLeft } from 'lucide-react';
import { timeFromNow } from '@/lib/helpers/time';
import { formatAddress } from "@/lib/address";

export default function PotPage({ id }: { id: string }) {
  const router = useRouter();
  const potId = BigInt(id);
  const searchParams = useSearchParams();
  const joinSearchParam = searchParams.get('join');
  const autoJoin = joinSearchParam === '' || !!joinSearchParam;

  const { isConnected, address } = useAccount();
  const { ensureConnection } = useConnection();
  const { handleJoinPot, isLoading: isLoadingAllowance, joiningPotId } = useJoinPot();
  const isJoining = joiningPotId !== null;

  const [copied, setCopied] = useState(false);
  const [pot, setPot] = useState<TPotObject | null>(null);
  const [loadingPot, setLoadingPot] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const disabled = !isConnected ? isJoining : isJoining || isLoadingAllowance;


  // Load pot details on mount
  useEffect(() => {
    async function loadPot() {
      setLoadingPot(true);
      setError(null);
      try {
        const [potRaw, potParticipants] = await Promise.all([fetchPot(potId), getPotParticipants(potId)]);
        setPot(potMapper(potRaw, "0xdeadbeef", potParticipants));
      } catch {
        setError("Failed to load pot details");
      } finally {
        setLoadingPot(false);
      }
    }
    loadPot();
  }, [id]);

  // join pot from search param
  useEffect(() => {
    if (!isLoadingAllowance && autoJoin && pot) {
      async function handleAutoJoin(pot: TPotObject) {
        if (isConnected && address) {
          await handleJoinPot(pot);
        } else {
          ensureConnection().then(() => {
            handleJoinPot(pot).catch(err => {
              console.error("Failed to join pot:", err);
              toast.error("Failed to join pot");
            });
          })
        }
      }
      handleAutoJoin(pot);
    }
  }, [autoJoin, pot, isLoadingAllowance])

  // Handle copy invite link
    const handleCopyLink = async () => {
      if (potId === null) {
        toast.error("Pot ID is not available. Please create a pot first.");
        return;
      } 
      try {
        await navigator.clipboard.writeText(getInviteLink(potId));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        console.error("Failed to copy link:", err);
        toast.error("Failed to copy link");
      }
    };

    const handleCastOnFarcaster = () => {
      if (!potId) {
        toast.error("Pot ID is not available. Please create a pot first.");
        return;
      }
      const castText = generateRandomCast(Number(formatUnits(pot?.entryAmount ?? 0n, 6)), pot?.period ?? 0n, potId);
      // Open Warpcast in a new tab with pre-filled message
      const warpcastUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(castText)}`;
      window.open(warpcastUrl, '_blank');
    };

  if (loadingPot) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-96px)]">
          <Loader2 className="animate-spin text-gray-500" size={32} />
        </div>
    );
  }
  if (error || !pot) {
    return <div className="flex items-center justify-center min-h-[300px]">{error || "Pot not found"}</div>;
  }

  return (<div>
    <div className="w-full flex items-center justify-between gap-4 mb-8">
      <div className='flex items-cener justify-center gap-4'>
        <GradientButton3
          onClick={() => router.push('/')}
          className="text-sm h-9 flex items-center rounded-[10px]"
        >
          <MoveLeft size={20} />
        </GradientButton3>
        <div className="w-full whitespace-nowrap">
          <p className="text-2xl font-bold">{pot.name}</p>
        </div>
      </div>
      {isConnected && address && pot.activeParticipants.includes(address) ? <div className="bg-green-500/30 text-green-500 h-[24px] px-[10px] flex items-center justify-center rounded-[10px] border border-green-500">
        <p className="text-xs font-light">joined</p>
      </div> : null}
    </div>

    <GradientCard2 className="w-full mt-4 pb-4">
      <div>
        <div className='flex'>
          <div className="flex bg-cyan-500/20 py-1 px-1.5 rounded-full gap-1.5 items-center">
            <Clock5 size={14} className='text-cyan-400' />
            <p className="text-xs font-bold text-cyan-400">Next draw in: {timeFromNow(Number(pot.deadline))}</p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-3'>
        <div className='col-start-3 text-end'>
          <p className='text-cyan-400 font-bold text-[28px] leading-none'>${pot.totalPool}</p>
          <p className='text-[13px] font-light leading-relaxed'>Total Pool</p>
        </div>
      </div>

      <div className='mt-0 grid grid-cols-5'>
        <div className='col-span-2 grid grid-cols-2'>
          <div className='flex items-center justify-start gap-1'>
            <UsersRound strokeWidth='1.25px' size={18} color='#14b6d3' />
            <span className='font-base text-[14px]'>
              {String(pot.round) === '0'
                ? String(pot.totalParticipants)
                : `${String(pot.activeParticipants.length)}/${String(pot.totalParticipants)}`
                }
            </span>
          </div>
          <p className='font-base text-[14px]'>${formatUnits(pot.entryAmount, 6)} {pot.periodString}</p>
        </div>
      </div>

      {pot.round === 0 ? null : <div className='mt-2 w-full h-2 bg-[#2d0046] rounded-full'>
        <div style={{ width: `${Math.trunc(100 * pot.activeParticipants.length / pot.totalParticipants)}%` }} className={'rounded-full h-2 bg-green-500'}/>
      </div>}

      <GradientButton
        className="w-full mt-3 mx-auto font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 text-[40px]"
        onClick={(e) => {
          e.preventDefault();
          if (isConnected && address) {
            if (pot.activeParticipants.includes(address)) {
              toast.info('You have already joined this pot');
            } else {
              handleJoinPot(pot);
            }
          } else {
            ensureConnection();
          }
        }}
        disabled={disabled}
      >
        {(!isConnected || !address) ? 'Connect' : pot.activeParticipants.includes(address) ? 'Joined' : isJoining ? "Joining..." : pot.round !== 0 ? `Pay This Round (${pot.entryAmount ? formatUnits(pot.entryAmount, 6) : '0'} USDC)` : "Join Pot"}
      </GradientButton>
      <p className={'mt-2 text-sm'}>Balance: {'balance'} USDC</p>
    </GradientCard2>

    <div className="mt-4 gap-3 grid grid-cols-2">
      <GradientButton3
        className="w-full flex items-center justify-center gap-2"
        onClick={handleCopyLink}
      >
        {copied ? <CircleCheckBig size={18} /> : <Copy size={18} />}
        <p>{copied ? 'Copied!' : 'Invite Link'}</p>
      </GradientButton3>

      <GradientButton3
        className="w-full flex items-center justify-center gap-2"
        onClick={handleCastOnFarcaster}
      >
        <MessageSquarePlus size={18} />
        <p>Cast</p>
      </GradientButton3>
    </div>

    <div className="mt-4 grid grid-cols-3 gap-4">
      <div
        className={`
          max-w-full mx-auto block py-3 transition-colors
          rounded-[12px] bg-app-cyan/20 border border-app-cyan
          disabled:text-gray-100
          text-gray-400 shadow-md
          w-full flex flex-col items-center justify-center
          `}
      >
        <p className="font-bold text-2xl">{pot.round}</p>
        <p className="text-sm">Total Rounds</p>
      </div>
      <div
        className={`
          max-w-full mx-auto block py-3 transition-colors
          rounded-[12px] bg-app-cyan/20 border border-app-cyan
          disabled:text-gray-100
          text-gray-400 shadow-md
          w-full flex flex-col items-center justify-center
          `}
      >
        <p className="font-bold text-2xl">{pot.round}</p>
        <p className="text-sm">Total Rounds</p>
      </div>
      <div
        className={`
          max-w-full mx-auto block py-3 transition-colors
          rounded-[12px] bg-app-cyan/20 border border-app-cyan
          disabled:text-gray-100
          text-gray-400 shadow-md
          w-full flex flex-col items-center justify-center
          `}
      >
        <p className="font-bold text-2xl">${Number(pot.totalPool) * pot.round}</p>
        <p className="text-sm">Total Won</p>
      </div>
    </div>

    <div className="mt-4 border border-gray-500 py-6 rounded-xl">
      <div className="flex items-center gap-2 px-4">
        <TrendingUp strokeWidth='2px' size={18} color='#14b6d3' />
        <p>Recent Activities</p>
      </div>
      <hr className="my-2 border-gray-500" />

      <div className="mt-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* TODO: get all logs related to this pot (PotJoined, PotCreated) */}
          {pot.activeParticipants.map((participant, index) => {
            const amount = '80';
            const isWinner = index === 0;
            const formattedAddress = formatAddress(participant);
            
            return (<div key={index} className="px-4 flex items-start justify-between">
              <div className="flex items-start gap-2">
                {isWinner ? '🎉' : <MoveUpRight className="mt-0.5" strokeWidth='2px' size={20} color='#14b6d3' />}
                <div>
                  <p className={`text-base ${isWinner ? 'text-green-500' : 'text-app-cyan'}`}>{isWinner ? 'Winner Payout' : 'Deposited'}</p>
                  <p className="text-xs">{'June 5, 2025'}</p>
                </div>
              </div>
              
              <div>
                <p className={`text-base ${isWinner ? 'text-green-500' : 'text-app-cyan'}`}>{amount} USDC</p>
                <p className="text-xs">{formattedAddress}</p>
              </div>
            </div>);
          
          })}
        </div>
      </div>
      
    </div>


    
  </div>);
}
