import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getPotCreatedLogsForAddress } from '@/lib/getLogs';
import type { TPot, TPotObject } from '@/lib/types';
import { getPotParticipants, fetchPot, potMapper } from '@/lib/helpers/contract';
import { formatUnits, type Address } from 'viem';
import { Loader2, UsersRound } from 'lucide-react';
import { BorderButton, GradientButton4 } from '../ui/Buttons';
import { GradientCard2 } from '../ui/GradientCard';
import { useJoinPot } from '@/hooks/useJoinPot';
import { useAccount } from 'wagmi';
import { useConnection } from '@/hooks/useConnection';
import { toast } from 'sonner';
import { timeFromNow } from '@/lib/helpers/time';
import { DurationPill } from '@/components/ui/Pill';

// let _loadPotsEffectFlag = true;
let _fetchPotsEffectFlag = true; // prevent multiple fetches

let potIdToPotMap: Record<string, TPotObject> = {};

export default function YourPots() {
  const { ensureConnection } = useConnection();
  const { handleJoinPot, joiningPotId } = useJoinPot();
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
    if (!address) return;

    if (!_fetchPotsEffectFlag) {
      console.log('Skipping fetch pots effect as it has already run.');
      return;
    }
    _fetchPotsEffectFlag = false;

    (async () => {
      const _logs = (await getPotCreatedLogsForAddress(address)) as unknown as Array<{
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
          // fetchedPot = await fetchPot(potId);
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
  }, [address]);

  // ---------
  // RENDERING
  // ---------

  // Filtered pots based on selected tab
  const filteredPots: TPotObject[] = pots;

  return (
    <div className={'mt-6'}>
      <h2 className='text-2xl font-bold mb-3'>Your Pots</h2>

      {!isConnected || !address ? (
        // ----------------------
        // CONNECT WALLET SECTION
        // ----------------------
        <div className={'w-full h-[213px] flex flex-col items-center justify-center'}>
          <GradientButton4
            isActive={true}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              ensureConnection()
                .then(() => {
                  toast.success('Wallet connected');
                })
                .catch(() => {
                  toast.error('Failed to connect wallet');
                });
            }}
            disabled={isConnecting}
            className='h-[30px] max-w-min min-w-[120px] whitespace-nowrap flex items-center justify-center justify-self-end'
          >
            {isConnecting ? 'Connecting' : !isConnected || !address ? 'Connect wallet' : null}
          </GradientButton4>
          <p className={'text-sm text-cyan-400 mt-2'}>Connect your wallet to see your pots</p>
        </div>
      ) : filteredPots.length === 0 ? (
        loading ? (
          // ---------------------
          // INITIAL LOADING STATE
          // ---------------------
          <div className={'w-full h-[213px] flex flex-col items-center justify-center'}>
            <Loader2 className='my-auto animate-spin' color='#7C65C1' size={32} />
          </div> // -----------------------
        ) : (
          // NO POTS AVAILABLE STATE
          // -----------------------
          <div className={'w-full h-[213px] flex flex-col items-center justify-center'}>
            <p className={'text-sm text-cyan-400 mt-2'}>No pots available</p>
          </div>
        )
      ) : (
        // --------------------
        // DISPLAY POTS SECTION
        // --------------------
        <div className='max-h-[213px] flex flex-row overflow-x-scroll gap-[12px] md:grid-cols-2 lg:grid-cols-3'>
          {filteredPots.map((pot: TPotObject) => (
            <YourPotCard
              key={pot.id}
              pot={pot}
              isJoining={joiningPotId !== null}
              joiningPotId={joiningPotId}
              handleJoinPot={handleJoinPot}
              isConnected={isConnected}
              isConnecting={isConnecting}
              address={address}
              className={filteredPots.length === 1 ? 'w-full' : ''}
            />
          ))}
          {loading ? (
            <div
              className={
                'min-w-[315px] max-w-[315px] min-h-[213px] max-h-[213px] flex justify-center'
              }
            >
              <Loader2 className='my-auto animate-spin' color='#7C65C1' size={32} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function YourPotCard({
  pot,
  isJoining,
  joiningPotId,
  handleJoinPot,
  isConnected,
  isConnecting,
  address,
  className,
}: {
  pot: TPotObject;
  isJoining: boolean;
  joiningPotId: bigint | null;
  handleJoinPot: (pot: TPotObject) => void;
  isConnected: boolean;
  isConnecting: boolean;
  address: Address;
  className?: string;
}) {
  const router = useRouter();
  const isJoined = pot.activeParticipants.includes(address as Address);
  const completedContributions: number = isJoined ? 1 + pot.round : pot.round;

  return (
    <GradientCard2
      key={pot.id}
      className={`min-w-[315px] max-w-full pt-[12px] px-[12px] pb-[12px] ${className}`}
    >
      <div className={'flex justify-end'}>
        <DurationPill text={`${timeFromNow(Number(pot.deadline))}`} className={'text-[15px]'} />
      </div>
      <p className='text-[18px] font-bold leading-none'>{pot.name}</p>
      <div className='grid grid-cols-3'>
        <div className='col-start-3 text-end'>
          <p className='text-cyan-400 font-bold text-[20px] leading-none'>${pot.totalPool}</p>
          <p className='text-xs font-light leading-relaxed'>Total Pool</p>
        </div>
      </div>

      <div className='mt-0 grid grid-cols-5'>
        <div className='col-span-3 grid grid-cols-2'>
          <div className='flex items-center justify-start gap-1'>
            <UsersRound strokeWidth='1.25px' size={18} color='#14b6d3' />
            <span className='font-base text-[14px]'>
              {String(pot.round) === '0'
                ? String(pot.totalParticipants)
                : `${String(pot.activeParticipants.length)}/${String(pot.totalParticipants)}`}
            </span>
          </div>
          <p className='font-base text-[14px]'>
            ${formatUnits(pot.entryAmount, 6)} {pot.periodString}
          </p>
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

      {/* Buttons */}
      <div className={'w-full mt-[14px] grid grid-cols-2 gap-4'}>
        {/* View Details */}
        <BorderButton
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            router.push(`/pot/${pot.id}`);
          }}
          className='h-[30px] max-w-min min-w-[87px] whitespace-nowrap flex items-center justify-center'
        >
          View Details
        </BorderButton>
        {/* Pay Now */}
        <GradientButton4
          type='button'
          isActive={true}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (isJoined) {
              toast.info('You have already paid for this pot');
              return;
            }
            handleJoinPot(pot);
          }}
          disabled={isJoined || (isJoining && joiningPotId === pot.id)}
          className='h-[30px] max-w-min min-w-[87px] whitespace-nowrap flex items-center justify-center justify-self-end'
        >
          {isConnecting
            ? 'Connecting'
            : !isConnected
              ? 'Connect'
              : isJoined
                ? 'Paid'
                : isJoining && joiningPotId === pot.id
                  ? 'Paying...'
                  : 'Pay Now'}
        </GradientButton4>
      </div>
    </GradientCard2>
  );
}
