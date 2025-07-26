'use client';

import { TrendingUp, Loader2, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHasJoinedRound } from "@/lib/helpers/contract";
import type { TPotObject } from "@/lib/types/contract.type";
import { useJoinPot } from "@/hooks/useJoinPot";
import { GradientButton2, GradientButton3 } from "../ui/Buttons";
import { GradientCard2 } from "../ui/GradientCard";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { MoveLeft } from "lucide-react";
import { timeFromNow } from "@/lib/helpers/time";
import { DurationPill } from "@/components/ui/Pill";
import Image from "next/image";
import { RecentActivity } from "@/components/sections/RecentActivity";
import { ShareDropdown } from "@/components/ui/ShareDropdown";
import { useRequestPot } from "@/hooks/useRequestPotAllow";
import { JoinRequests } from "../sections/PotRequests";
import { fetchPotInfo, fetchPotParticipationInfo, type LogEntry } from "@/lib/graphQueries";
import type { Address } from 'viem';

const defaultLogsState = { loading: true, error: null, logs: [] };
const defaultParticipationState = { loading: false, error: null, data: null };

export default function PotPage({ id }: { id: string }) {
  const router = useRouter();
  const potId = BigInt(id);

  const { isConnected, address } = useAccount();
  const {
    handleJoinPot,
    isLoading: isLoadingJoinPot,
    joiningPotId,
    joinedPotId,
    tokenBalance,
  } = useJoinPot();
  const { handleRequest, pendingRequest } = useRequestPot();

  // STATES
  const [pot, setPot] = useState<TPotObject | null>(null);
  const [loadingPot, setLoadingPot] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState<boolean | null>(null);
  const [hasJoinedRound, setHasJoinedRound] = useState<boolean>(false);
  const [logsState, setLogsState] = useState<{
    loading: boolean;
    error: string | null;
    logs: LogEntry[];
  }>(defaultLogsState);
  const [participationState, setParticipationState] = useState<{
    loading: boolean;
    error: string | null;
    data: { isAllowed: boolean; hasRequested: boolean | null } | null;
  }>(defaultParticipationState);

  const isPotRequested = participationState.data?.hasRequested ?? null;
  const isRequestApproved = participationState.data?.isAllowed ?? false;

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
      } catch {
        setError("Failed to load pot details");
      } finally {
        setLoadingPot(false);
      }
    })();
  }, [potId]);

  // Load pot participation info when address is available
  useEffect(() => {
    (async function loadPotParticipationInfo() {
      if (!address) {
        setParticipationState(defaultParticipationState);
        return;
      }

      setParticipationState((prev) => ({ ...prev, loading: true }));
      try {
        const info = await fetchPotParticipationInfo(potId, address);
        setParticipationState((prev) => ({ ...prev, data: info }));
      } catch {
        setParticipationState((prev) => ({ ...prev, error: "Failed to load pot participation info" }));
      } finally {
        setParticipationState((prev) => ({ ...prev, loading: false }));
      }
    })();
  }, [potId, address]);

  useEffect(() => {
    if (pot && pendingRequest == null) {
      (async function loadRequestState() {})();
    }
  }, [pot, pendingRequest]);

  // Has user joined pot previously (requires wallet connection)
  useEffect(() => {
    if (isConnected && address && !!pot) {
      (async () => {
        if (address.toLowerCase() === pot.creator && pot.round === 0) {
          setHasJoinedRound(true);
          setHasJoinedBefore(true);
        } else {
          console.log("Checking if user has joined round 0");
          setHasJoinedBefore(await getHasJoinedRound(pot.id, 0, address));
        }
      })();
    }
    console.log('pot?.creator', pot?.creator);
  }, [isConnected, address, pot]);

  // Update state when joinedPotId changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!!pot && !!address && !hasJoinedRound) {
      if (joinedPotId === pot.id) {
        pot.totalParticipants += 1;
        pot.participants.push(address);
        setHasJoinedRound(true);
      } else {
        setHasJoinedRound(pot.participants.includes(address.toLowerCase() as Address));
      }
    }
  }, [pot, joinedPotId, address]);

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

  // DERIVED STATE
  const isPublic: boolean = pot.isPublic;
  const isRoundZero: boolean = pot.round === 0;
  const isJoiningPot: boolean = joiningPotId !== null;
  const initialLoading: boolean = isLoadingJoinPot || loadingPot;
  const cannotJoinPot: boolean =
    !isRoundZero && hasJoinedBefore !== null && !hasJoinedBefore;
  const potFull: boolean =
    isRoundZero && pot.participants.length === pot.maxParticipants;
  const insufficientBalance: boolean =
    tokenBalance !== undefined && tokenBalance < pot.entryAmount;
  const deadlinePassed: boolean =
    pot.deadline < BigInt(Math.floor(Date.now() / 1000));
  const completedContributions: number = hasJoinedRound
    ? 1 + pot.round
    : pot.round;

  const disabled: boolean =
    initialLoading ||
    potFull ||
    deadlinePassed ||
    !!address && (
      isJoiningPot ||
      hasJoinedRound ||
      cannotJoinPot ||
      insufficientBalance ||
      (isPotRequested && !isRequestApproved) ||
      pendingRequest !== null ||
      isPotRequested === null
    );

  const joinButtonText = initialLoading ? (
    "Loading"
  ) : hasJoinedRound ? (
    "Joined"
  ) : isJoiningPot ? (
    "Joining"
  ) : deadlinePassed ? (
    "Expired ⌛"
  ) : potFull ? (
    "Pot Full 📦"
  ) : !isConnected || !address ?
    "Connect wallet to Join"
    : insufficientBalance ? (
    "Insufficient Balance 💰"
  ) : isRoundZero ? (
    pendingRequest !== null ? (
      "Requesting Access"
    ) : isPublic ? (
      "Join Pot"
    ) : isPotRequested === null ? (
      "Loading"
    ) : isPotRequested ? (
      isRequestApproved ? (
        "Join Pot"
      ) : (
        "Pending Approval"
      )
    ) : (
      "Request Access"
    )
  ) : hasJoinedBefore ? (
    <span className={"flex items-center justify-center"}>
      <span>Pay This Round (</span>
      <span className={"mr-1"}>
        <Image src={"/usdc.png"} alt={"usdc"} width={16} height={16} />
      </span>
      <span>{pot.entryAmount})</span>
    </span>
  ) : (
    "Cannot Join 😔"
  );

  const handlePotButtonClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    if (isPublic || isRequestApproved) {
      await handleJoinPot(pot).then().catch();
    } else if (!isPotRequested) {
      await handleRequest(pot.id);
      // .then(() => {
      //   setIsPotRequested(true);
      // })
      // .catch();
    }
  };

  return (
    <div>
      <div className="w-full flex items-center justify-between gap-4 mb-8">
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

      <GradientCard2 className="w-full mt-4 pb-4">
        <div>
          <div className="flex">
            <DurationPill
              text={
                deadlinePassed
                  ? "Awaiting payout"
                  : `Next draw in: ${timeFromNow(Number(pot.deadline))}`
              }
            />
          </div>
        </div>

        {/* Total Pool amount, Participants, Entry amount, Total pool text */}
        <div className="mt-2 grid grid-cols-5">
          <div className="col-span-5">
            <p className="w-full text-end text-cyan-400 font-bold text-[38px] leading-none">
              ${pot.totalPool}
            </p>
          </div>
          <div className="col-span-3 grid grid-cols-2">
            <div className="flex items-center justify-start gap-1">
              <UsersRound strokeWidth="1.25px" size={18} color="#14b6d3" />
              <span className="font-base text-[14px]">
                {isRoundZero
                  ? `${String(pot.participants.length)}/${String(
                      pot.maxParticipants
                    )}`
                  : `${String(pot.participants.length)}/${String(
                      pot.totalParticipants
                    )}`}
              </span>
            </div>
            <p className="font-base text-[14px] whitespace-nowrap text-left">
              ${pot.entryAmountFormatted} {pot.periodString}
            </p>
          </div>
          <p className="col-span-2 font-base text-[14px] text-right">
            Total Pool
          </p>
        </div>

        {/* User contribution progress bar */}
        <p className={"mt-4 text-xs text-white/80 leading-none"}>
          {completedContributions}/{pot.totalParticipants} contribution
          {pot.totalParticipants > 1 ? "s" : ""} complete
        </p>
        <div className="mt-1 w-full h-2 bg-[#2d0046] rounded-full">
          <div
            style={{
              width: `${Math.trunc(
                (100 * completedContributions) / pot.totalParticipants
              )}%`,
            }}
            className={"rounded-full h-2 bg-green-500"}
          />
        </div>

        <GradientButton2
          isActive={true}
          className="w-full h-[35px] flex items-center justify-center mt-3 mx-auto shadow-lg hover:shadow-xl transition-all duration-300 text-base font-bold rounded-xl"
          onClick={(e) => {
            handlePotButtonClick(e);
          }}
          disabled={disabled}
        >
          <span className={"flex items-center justify-center gap-2"}>
            <span>{joinButtonText}</span>
            {initialLoading ? (
              <Loader2 className="animate-spin h-5 w-5 text-white" size={20} />
            ) : null}
          </span>
        </GradientButton2>
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
      {pot.creator === address && pot.round === 0 && (
        <JoinRequests potId={pot.id} />
      )}

      <div className="mt-4 border border-gray-500 pt-6 rounded-xl">
        <div className="flex items-center gap-2 px-4">
          <TrendingUp strokeWidth="2px" size={18} color="#14b6d3" />
          <p>Recent Activities</p>
        </div>
        <hr className="mt-2 border-gray-500" />
        <RecentActivity logsState={logsState} pot={pot} />
      </div>
    </div>
  );
}
