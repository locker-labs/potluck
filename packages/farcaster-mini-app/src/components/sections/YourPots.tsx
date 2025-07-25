import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { TPotObject } from "@/lib/types";
import { type Address } from "viem";
import { Loader2, UsersRound } from 'lucide-react';
import { BorderButton, GradientButton4 } from '../ui/Buttons';
import { GradientCard2 } from '../ui/GradientCard';
import { useJoinPot } from '@/hooks/useJoinPot';
import { useAccount } from 'wagmi';
import { timeFromNow } from '@/lib/helpers/time';
import { DurationPill } from '@/components/ui/Pill';
import { getPotsByCreator } from "@/lib/graphQueries";
import { motion } from 'motion/react';

// let _loadPotsEffectFlag = true;
let _fetchPotsEffectFlag = true; // prevent multiple fetches

let potIdToPotMap: Record<string, TPotObject> = {};

export default function YourPots() {
  const { handleJoinPot, joiningPotId, joinedPotId, tokenBalance } =
    useJoinPot();
  const { isConnected, isConnecting, address } = useAccount();

  // ------
  // STATES
  // ------
  const [loading, setLoading] = useState(true);
  const [pots, setPots] = useState<TPotObject[]>([]);

  // -------
  // EFFECTS
  // -------
  useEffect(() => {
    if (!isConnected) {
      setPots([]);
      setLoading(true);
    }
  }, [isConnected]);

  // Load pots from local storage on mount
  useEffect(() => {
    console.log("Loading pots from localStorage on mount");
    const potsObjectFromStorage = localStorage.getItem("pots");
    if (potsObjectFromStorage) {
      const potsMapFromStorage = JSON.parse(potsObjectFromStorage) as Record<
        string,
        TPotObject
      >;
      console.log("Loaded pots from localStorage:", potsMapFromStorage);
      potIdToPotMap = potsMapFromStorage;
      // maxPotId = BigInt(Math.max(...potIdsList));
    }
  }, []);

  // Get logs from contract on mount
  useEffect(() => {
    if (!address) return;

    if (!_fetchPotsEffectFlag) {
      console.log("Skipping fetch pots effect as it has already run.");
      return;
    }
    _fetchPotsEffectFlag = false;

    (async () => {
      const pots = await getPotsByCreator(address as Address);
      setPots((prevPots) => [...prevPots, ...pots]);
      setLoading(false);
      _fetchPotsEffectFlag = true;
    })();
  }, [address]);

  // ---------
  // RENDERING
  // ---------

  if (!address || !isConnected) {
    return null;
  }

  if (pots.length === 0) {
    return null; // No pots to display
  }

  // Not showing loading state right now

  return (
    <motion.div
      initial={{ opacity: 0, y: -40, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 270 }}
      exit={{ opacity: 0, y: -40, height: 0 }}
      transition={{ duration: 0.4, ease: ['easeOut', 'easeIn'] }}
      style={{ overflow: 'hidden' }}
      key="your-pots">
  <div>
      <h2 className='text-2xl font-bold mb-3'>Your Pots</h2>
      <div className='flex flex-row overflow-x-scroll gap-[12px] md:grid-cols-2 lg:grid-cols-3'>
          {pots.map((pot: TPotObject) => (
            <YourPotCard
              key={pot.id}
              pot={pot}
              joiningPotId={joiningPotId}
              joinedPotId={joinedPotId}
              handleJoinPot={handleJoinPot}
              address={address}
              className={pots.length === 1 ? 'w-full' : ''}
              tokenBalance={tokenBalance}
            />
          ))}
          {loading ? (
            <div
              className={
                "min-w-[315px] max-w-[315px] min-h-[213px] max-h-[213px] flex justify-center"
              }
            >
              <Loader2
                className="my-auto animate-spin"
                color="#7C65C1"
                size={32}
              />
            </div>
          ) : null}
        </div>
    </div>
  </motion.div>
    );
}

export function YourPotCard({
  pot,
  joiningPotId,
  joinedPotId,
  handleJoinPot,
  address,
  className,
  tokenBalance,
}: {
  pot: TPotObject;
  joiningPotId: bigint | null;
  joinedPotId: bigint | null;
  handleJoinPot: (pot: TPotObject) => void;
  address: Address;
  className?: string;
  tokenBalance: bigint | undefined;
}) {
  const router = useRouter();
  const isJoined = pot.participants.includes(address as Address);

  const [hasJoinedRound, setHasJoinedRound] = useState<boolean>(
    !!address && pot.participants.includes(address)
  );

  const completedContributions: number = isJoined ? 1 + pot.round : pot.round;

  // Update hasJoinedRound when joinedPotId changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!address) {
      setHasJoinedRound(false);
    } else {
      if (!hasJoinedRound) {
        if (joinedPotId === pot.id) {
          setHasJoinedRound(true);
        } else {
          setHasJoinedRound(pot.participants.includes(address));
        }
      }
    }
  }, [joinedPotId, address]);

  // DERIVED STATE
  const isRoundZero: boolean = pot.round === 0;
  const isJoiningPot: boolean = joiningPotId === pot.id;
  const initialLoading: boolean = false;
  const insufficientBalance: boolean =
    tokenBalance !== undefined && tokenBalance < pot.entryAmount;
  const deadlinePassed: boolean =
    pot.deadline < BigInt(Math.floor(Date.now() / 1000));

  const disabled: boolean =
    isJoiningPot ||
    hasJoinedRound ||
    initialLoading ||
    insufficientBalance ||
    deadlinePassed;

  const joinButtonText = initialLoading
    ? "Loading"
    : hasJoinedRound
    ? "Paid"
    : isJoiningPot
    ? "Paying"
    : deadlinePassed
    ? "Expired ⌛"
    : insufficientBalance
    ? "Insufficient Balance 💰"
    : isRoundZero
    ? "Join Pot"
    : "Pay Now";

  return (
    <GradientCard2
      key={pot.id}
      className={`min-w-[315px] max-w-full pt-[12px] px-[12px] pb-[12px] ${className}`}
    >
      <div className={"flex justify-end"}>
        <DurationPill
          text={
            deadlinePassed
              ? "Awaiting payout"
              : `${timeFromNow(Number(pot.deadline))}`
          }
          className={"text-[15px]"}
        />
      </div>
      <p className="text-[18px] font-bold leading-[1.2] line-clamp-1">
        {pot.name}
      </p>

      <div className="mt-2 grid grid-cols-5">
        {/* Total Pool amount */}
        <div className="col-span-5">
          <p className="w-full text-end text-cyan-400 font-bold text-[38px] leading-none">
            ${pot.totalPool}
          </p>
        </div>
        {/* Participants, Entry amount, Total pool text */}
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
            ${pot.entryAmount} {pot.periodString}
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

      {/* Buttons */}
      <div className={"w-full mt-[14px] grid grid-cols-2 gap-4"}>
        {/* View Details */}
        <BorderButton
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            router.push(`/pot/${pot.id}`);
          }}
          className="h-[30px] max-w-min min-w-[87px] whitespace-nowrap flex items-center justify-center"
        >
          View Details
        </BorderButton>
        {/* Pay Now */}
        <GradientButton4
          type="button"
          isActive={true}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleJoinPot(pot);
          }}
          disabled={disabled}
          className="h-[30px] max-w-min min-w-[87px] whitespace-nowrap flex items-center justify-center justify-self-end"
        >
          <span className={"flex items-center justify-center gap-2"}>
            <span>{joinButtonText}</span>
            {isJoiningPot ? (
              <Loader2 className="animate-spin h-4 w-4 text-white" size={20} />
            ) : null}
          </span>
        </GradientButton4>
      </div>
    </GradientCard2>
  );
}
