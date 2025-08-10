'use client';

import { TrendingUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { TPotObject } from "@/lib/types/contract.type";
import { GradientButton3 } from "@/components/ui/Buttons";
import { GradientCard2 } from "@/components/ui/GradientCard";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { MoveLeft } from "lucide-react";
import { RecentActivity } from "@/components/sections/RecentActivity";
import { ShareDropdown } from "@/components/ui/ShareDropdown";
import { JoinRequests } from "@/components/sections/PotRequests";
import { fetchPotInfo, type LogEntry } from "@/lib/graphQueries";
import { JoinPotButton } from '@/components/buttons/JoinPotButton';
import { useJoinPot } from "@/hooks/useJoinPot";
import { useRequestPot } from "@/hooks/useRequestPot";
import { useUserPotRequestInfo } from '@/hooks/useUserPotRequestInfo';
import { useUserPotJoinInfo } from '@/hooks/useUserPotJoinInfo';
import type { Address } from 'viem';
import { PotProgressBar } from '../subcomponents/PotProgressBar';
import { DeadlinePill } from '../subcomponents/DeadlinePill';
import { motion } from "motion/react";
import { animate, initialDown, transition } from "@/lib/pageTransition";
import { usePotluck } from '@/providers/PotluckProvider';
import { EntryPeriodAndMembers } from '../subcomponents/EntryPeriodAndMembers';
import { PotInfo } from '../subcomponents/PotInfo';

const defaultLogsState = { loading: true, error: null, logs: [] };

export default function PotPage({ id }: { id: string }) {
  const router = useRouter();
  const potId = BigInt(id);

  const { address: addressWithCheckSum } = useAccount();
  const address = addressWithCheckSum?.toLowerCase() as Address | undefined;

  // STATES
  const [pot, setPot] = useState<TPotObject | null>(null);
  const [showRequests, setShowRequests] = useState(false);
  const [loadingPot, setLoadingPot] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logsState, setLogsState] = useState<{
    loading: boolean;
    error: string | null;
    logs: LogEntry[];
  }>(defaultLogsState);

  const { users, fetchUsers } = usePotluck();

  const {
    handleJoinPot,
    isLoading: isLoadingJoinPot,
    joiningPotId,
    joinedPotId,
    tokenBalance,
  } = useJoinPot();
  const { hasJoinedBefore, hasJoinedRound } = useUserPotJoinInfo({
    pot,
    address,
    joinedPotId,
  });

  const { handleRequest, requestingPotId, requestedPotId } = useRequestPot();
  const isPrivatePot = pot ? !pot.isPublic : false;
  const userPotRequestInfo = useUserPotRequestInfo({
    potId,
    address,
    requestingPotId,
    requestedPotId,
    enabled: isPrivatePot,
  });

  // EFFECTS

  // Load pot details on mount
  useEffect(() => {
    (async function loadPot() {
      setLoadingPot(true);
      setError(null);

      try {
        const potInfo = await fetchPotInfo(potId);
        const { pot, logs } = potInfo;
        setPot(pot);
        setLogsState({ loading: false, error: null, logs });
        if (pot.creator === address && pot.round === 0 && !pot.isPublic) {
          setShowRequests(true);
        }
      } catch {
        setError("Failed to load pot details");
      } finally {
        setLoadingPot(false);
      }
    })();
  }, [potId, address]);

  // RENDERING

  // 1️⃣ Loading and error states
  if (loadingPot) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-96px)]">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }
  if (error || !pot) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        {error || "Pot not found"}
      </div>
    );
  }

  // 2️⃣ Main content
  return (
    <motion.div
      className={'px-4'}
      initial={initialDown}
      animate={animate}
      transition={transition}
    >
      <div className="w-full flex items-center justify-between gap-4 mb-4">
        <div className="flex items-cener justify-center gap-4">
          <GradientButton3
            onClick={() => router.push("/")}
            className="text-sm h-9 flex items-center rounded-[10px]"
          >
            <MoveLeft size={20} />
          </GradientButton3>
          <div className="flex items-center justify-start gap-2">
            <div className="w-full">
              <p className="text-2xl font-bold line-clamp-2">{pot.name}</p>
            </div>
            <ShareDropdown pot={pot} />
          </div>
        </div>
        {hasJoinedBefore || hasJoinedRound ? (
          <div className="bg-green-500/30 text-green-500 h-[24px] px-[10px] flex items-center justify-center rounded-[10px] border border-green-500">
            <p className="text-xs font-light">joined</p>
          </div>
        ) : null}
      </div>

      {/*  TODO: Create a reusable component  */}
      <GradientCard2 className="w-full">
        <div>
          <div className="flex">
            <DeadlinePill pot={pot} />
          </div>
        </div>

        <PotInfo pot={pot} />

        {/* Pot progress bar */}
        <PotProgressBar pot={pot} />

        <JoinPotButton
          style="blue"
          loadingPot={loadingPot}
          pot={pot}
          isLoadingJoinPot={isLoadingJoinPot}
          joiningPotId={joiningPotId}
          tokenBalance={tokenBalance}
          hasJoinedBefore={hasJoinedBefore}
          hasJoinedRound={hasJoinedRound}
          handleJoinPot={handleJoinPot}
          userPotRequestInfo={userPotRequestInfo}
          handleRequest={handleRequest}
        />
      </GradientCard2>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div
          className={`
          max-w-full mx-auto py-3 transition-colors
          rounded-[12px] bg-app-cyan/20 border border-app-cyan
          disabled:text-gray-100
          text-gray-400 shadow-md
          w-full flex flex-col items-center justify-center
          `}
        >
          <p className="font-bold text-2xl">{1 + pot.round}</p>
          <p className="text-sm">Total Rounds</p>
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
          <p className="font-bold text-2xl">
            ${Number(pot.totalPool) * pot.round}
          </p>
          <p className="text-sm">Total Won</p>
        </div>
      </div>
      {showRequests && <div className='mt-4'>
        <JoinRequests potId={pot.id} users={users} fetchUsers={fetchUsers} />
        </div>}

      <div className="mt-4 border border-gray-500 rounded-xl">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <TrendingUp strokeWidth="2px" size={18} color="#14b6d3" />
          <p>Recent Activities</p>
        </div>
        <hr className="border-gray-500" />
        <RecentActivity logsState={logsState} users={users} fetchUsers={fetchUsers} />
      </div>
    </motion.div>
  );
}
