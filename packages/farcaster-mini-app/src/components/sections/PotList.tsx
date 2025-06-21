import { useState, useEffect } from 'react';
import { getPotCreatedLogs } from '@/lib/getLogs';
import type { TPot, TPotObject } from '@/lib/types';
import { getPotParticipants, fetchPot, potMapper, getHasJoinedRound } from '@/lib/helpers/contract';
import { formatUnits, type Address } from 'viem';
import { Loader2, Clock5, UsersRound } from 'lucide-react';
import { GradientButton, GradientButton2 } from '../ui/Buttons';
import { GradientCard } from '../ui/GradientCard';
import Link from 'next/link';
import Image from 'next/image';
import { useJoinPot } from '@/hooks/useJoinPot';
import { useAccount } from 'wagmi';

// Helper to map period to seconds
const periodSecondsMap = {
  daily: BigInt(86400),
  weekly: BigInt(604800),
  monthly: BigInt(2592000),
};

let _fetchPotsEffectFlag = true; // prevent multiple fetches

let potIdToPotMap: Record<string, TPotObject> = {};

export default function PotList() {
  const { joinedPotId, handleJoinPot, joiningPotId, tokenBalance } = useJoinPot();

  // ------
  // STATES
  // ------

  const [loading, setLoading] = useState(true);
  const [pots, setPots] = useState<TPotObject[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly'>(
    'all',
  );

  // -------
  // EFFECTS
  // -------

  // Load pots from local storage on mount
  useEffect(() => {
    console.log('Loading pots from localStorage on mount');
    const potsObjectFromStorage = localStorage.getItem('pots');
    if (potsObjectFromStorage) {
      const potsMapFromStorage = JSON.parse(potsObjectFromStorage) as Record<string, TPotObject>;
      console.log('Loaded pots from localStorage:', potsMapFromStorage);
      potIdToPotMap = potsMapFromStorage;
      // maxPotId = BigInt(Math.max(...potIdsList));
    }
  }, []);

  // Get logs from contract on mount
  useEffect(() => {
    if (!_fetchPotsEffectFlag) {
      console.log('Skipping fetch pots effect as it has already run.');
      return;
    }
    _fetchPotsEffectFlag = false;

    (async () => {
      const _logs = (await getPotCreatedLogs()) as unknown as Array<{
        address: Address;
        args: { potId: bigint; creator: Address };
        blockNumber: number;
        transactionHash: string;
      }>;

      for (const log of _logs.reverse()) {
        const potId = log.args.potId;
        const potCreator = log.args.creator as Address;

        // if (maxPotId !== null && potId <= maxPotId) {
        //   console.log(`Pot with ID ${potId} already exists as Max pot ID is ${maxPotId}.`);
        //   continue;
        // }

        // if (potIdToPotMap[String(potId)]) {
        //   console.log(`Pot with ID ${potId} already exists in potIdToPotMap.`);
        //   continue;
        // }

        let fetchedPot: TPot | null = null;
        let potParticipants: Address[] = [];

        try {
          const res = await Promise.all([fetchPot(potId), getPotParticipants(potId)]);
          fetchedPot = res[0];
          potParticipants = res[1];
        } catch (err) {
          console.error(`Failed to fetch pot with ID ${potId}:`, err);
        }

        if (fetchedPot) {
          const potObj: TPotObject = potMapper(fetchedPot, potCreator, potParticipants);
          potIdToPotMap[String(potId)] = potObj;
          // if (maxPotId === null) {
          //   maxPotId = potId;
          // } else {
          //   maxPotId = BigInt(Math.max(Number(maxPotId), Number(potId)));
          // }
          setPots((prevPots) => [...prevPots, potObj]);
        }
      }
      // TODO: convert bigint to string before storing in localStorage
      // localStorage.setItem('pots', JSON.stringify(potIdToPotMap));

      setLoading(false);
      _fetchPotsEffectFlag = true;
    })();
  }, []);

  // ---------
  // RENDERING
  // ---------

  // Filtered pots based on selected tab
  const filteredPots: TPotObject[] =
    selectedPeriod === 'all'
      ? pots
      : pots.filter((pot) => pot.period === periodSecondsMap[selectedPeriod]);

  return (
    <div>
      <h2 className='text-2xl font-bold mb-3'>Available Pots</h2>
      {/* Filter Tabs */}
      <div className='max-w-min'>
        <div className='flex gap-4 mb-4'>
          {['all', 'daily', 'weekly', 'monthly'].map((tab) => (
            <GradientButton2
              key={tab}
              onClick={() => {
                if (selectedPeriod !== tab) setSelectedPeriod(tab as typeof selectedPeriod);
              }}
              isActive={selectedPeriod === tab}
              className={`${selectedPeriod === tab ? (tab === 'all' ? 'px-[21px]' : 'px-[17px]') : tab === 'all' ? 'px-[20px]' : 'px-[16px]'}
              h-[40px] font-bold flex items-center text-[12px] rounded-full`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </GradientButton2>
          ))}
        </div>
      </div>
      {/* End Filter Tabs */}
      {!loading && filteredPots.length === 0 ? (
        <div className='text-center py-10 rounded-xl'>
          No pots available.
          <br />
          Be the first to create one!
        </div>
      ) : (
        <div className='grid gap-[22px] md:grid-cols-2 lg:grid-cols-3'>
          {filteredPots.map((pot: TPotObject) => (
            <PotCard
              key={pot.id}
              pot={pot}
              joiningPotId={joiningPotId}
              joinedPotId={joinedPotId}
              handleJoinPot={handleJoinPot}
              tokenBalance={tokenBalance}
            />
          ))}
        </div>
      )}
      {loading ? (
        <div className='mt-4 w-full flex justify-center'>
          <Loader2 className='animate-spin' color='#7C65C1' size={32} />
        </div>
      ) : null}
    </div>
  );
}

export function PotCard({
  pot,
  joiningPotId,
  joinedPotId,
  handleJoinPot,
  tokenBalance,
}: {
  pot: TPotObject;
  joiningPotId: bigint | null;
  joinedPotId: bigint | null;
  handleJoinPot: (pot: TPotObject) => void;
  tokenBalance: bigint | undefined;
}) {
  const { address, isConnected } = useAccount();

  const [hasJoinedBefore, setHasJoinedBefore] = useState<boolean | null>(null);
  const [hasJoinedRound, setHasJoinedRound] = useState<boolean>(
    isConnected && !!address && pot.participants.includes(address),
  );

  // Fetch join status for round 0
  useEffect(() => {
    if (isConnected && !!address && !!pot) {
      (async () => {
        setHasJoinedBefore(await getHasJoinedRound(pot.id, 0, address));
      })();
    }
  }, [isConnected, address, pot]);

  // Update hasJoinedRound when joinedPotId changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!address) {
      setHasJoinedRound(false);
    } else {
      if (!hasJoinedRound) {
        if (joinedPotId === pot.id) {
          pot.totalParticipants += 1;
          pot.participants.push(address);
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
  const cannotJoinPot: boolean = !isRoundZero && hasJoinedBefore !== null && !hasJoinedBefore;
  const potFull: boolean = isRoundZero && pot.participants.length === pot.maxParticipants;
  const insufficientBalance: boolean = tokenBalance !== undefined && tokenBalance < pot.entryAmount;
  const deadlinePassed: boolean = pot.deadline < BigInt(Math.floor(Date.now() / 1000));

  const disabled: boolean =
    isJoiningPot ||
    hasJoinedRound ||
    initialLoading ||
    cannotJoinPot ||
    potFull ||
    insufficientBalance ||
    deadlinePassed;
  const joinButtonText = initialLoading ? (
    'Loading'
  ) : hasJoinedRound ? (
    'Joined'
  ) : isJoiningPot ? (
    'Joining'
  ) : deadlinePassed ? (
    'Expired ⌛'
  ) : potFull ? (
    'Pot Full 📦'
  ) : insufficientBalance ? (
    'Insufficient Balance 💰'
  ) : isRoundZero ? (
    'Join Pot'
  ) : hasJoinedBefore ? (
    <span className={'flex items-center justify-center'}>
      <span>Pay This Round (</span>
      <span className={'mr-1'}>
        <Image src={'/usdc.png'} alt={'usdc'} width={16} height={16} />
      </span>
      <span>{formatUnits(pot.entryAmount, 6)})</span>
    </span>
  ) : (
    'Cannot Join 😔'
  );

  return (
    <GradientCard key={pot.id}>
      <Link href={`/pot/${pot.id}`} className='block'>
        <p className='text-[24px] font-normal line-clamp-1'>{pot.name}</p>
        <div className='mt-2 grid grid-cols-3'>
          <div className='col-start-3 text-start'>
            <p className='text-cyan-400 font-bold text-[28px] leading-none'>${pot.totalPool}</p>
            <p className='text-[13px] font-light leading-relaxed'>Total Pool</p>
          </div>
        </div>

        <div className='mt-3 mb-2 grid grid-cols-5'>
          <div className='col-span-3 grid grid-cols-2'>
            <div className='flex items-center justify-start gap-1'>
              <UsersRound strokeWidth='1.25px' size={18} color='#14b6d3' />
              <span className='font-base text-[14px]'>
                {`${String(pot.participants.length)}/${isRoundZero ? String(pot.maxParticipants) : String(pot.totalParticipants)}`}
              </span>
            </div>
            <p className='font-base text-[14px]'>
              ${formatUnits(pot.entryAmount, 6)} {pot.periodString}
            </p>
          </div>
          <div className='col-start-4 col-span-2'>
            <div className=' flex items-center justify-center gap-1'>
              <Clock5 size={14} color='#14b6d3' />
              <span className='font-bold text-[14px]'>
                {deadlinePassed ? 'Awaiting Payout' : `Closes in ${pot.deadlineString}`}
              </span>
            </div>
          </div>
        </div>

        <GradientButton
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleJoinPot(pot);
          }}
          disabled={disabled}
          className='w-full'
        >
          {joinButtonText}
        </GradientButton>
      </Link>
    </GradientCard>
  );
}
