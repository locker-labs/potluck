'use client';

import { useState } from 'react';
import { formatAddress } from '@/lib/address';
import { Loader2, MoveUpRight, ExternalLink } from 'lucide-react';
import { type Abi, formatUnits, type GetFilterLogsReturnType } from 'viem';
import Link from 'next/link';
import Image from 'next/image';
import type { TPotObject } from '@/lib/types';
import { useEffect } from 'react';
import { publicClient } from '@/clients/viem';
import { formatDateFromTimestamp } from '@/lib/date';

export function RecentActivity({
  logsState,
  pot,
}: {
  pot: TPotObject;
  logsState: { loading: boolean; error: string | null; logs: GetFilterLogsReturnType<Abi> };
}) {
  const [blockMapState, setBlockMapState] = useState<Map<bigint, bigint>>(new Map());

  const uniqueBlockNumbers = [...new Set(logsState.logs.map((l) => l.blockNumber.toString()))];
  const blockMap = new Map<bigint, bigint>(); // blockNumber -> timestamp

  useEffect(() => {
    (async () => {
      for (const blockNumStr of uniqueBlockNumbers) {
        const blockNumber = BigInt(blockNumStr);
        const block = await publicClient.getBlock({ blockNumber });
        blockMap.set(blockNumber, block.timestamp);
      }
      setBlockMapState(blockMap);
    })();
  }, [logsState.logs.length]);

  if (logsState.loading) {
    return (
      <div className={'py-4 flex items-center justify-center w-full h-[300px]'}>
        {/* TODO: replace loader with skeleton */}
        <Loader2 className='animate-spin' color='#7C65C1' size={32} />
      </div>
    );
  }

  if (logsState.error) {
    return (
      <div className={'py-4 flex items-center justify-center w-full h-[300px]'}>
        <p className='text-red-500'>Error: {logsState.error}</p>
      </div>
    );
  }

  return (
    <div className='py-4 max-h-[300px] overflow-y-auto'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {logsState.logs.map((log, index) => {
          const entryAmount: bigint = pot.entryAmount;
          const totalParticipants = pot.totalParticipants;
          const winnerPayout = BigInt(totalParticipants - 1) * entryAmount;
          const isWinner = log.eventName === 'PotPayout';
          const isCreator = log.eventName === 'PotCreated';
          const formattedAddress = formatAddress(log.transactionHash);

          return (
            //   biome-ignore lint/suspicious/noArrayIndexKey: using index as key for simplicity
            <div key={index} className='px-4 flex items-start justify-between'>
              <div className='flex items-start gap-2'>
                {isWinner ? (
                  '🎉'
                ) : (
                  <MoveUpRight className='mt-0.5' strokeWidth='2px' size={20} color='#14b6d3' />
                )}
                <div>
                  <p className={`text-base ${isWinner ? 'text-green-500' : 'text-app-cyan'}`}>
                    {isWinner ? 'Winner Payout' : isCreator ? 'Created' : 'Deposited'}
                  </p>
                  <div className='text-xs'>
                    {blockMapState.size ? (
                      formatDateFromTimestamp(Number(blockMapState.get(log.blockNumber) ?? 0))
                    ) : (
                      <div
                        className={
                          'h-2.5 mt-1 mb-0.5 bg-white/30 w-[120px] animate-pulse rounded-xl shadow-sm'
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className={'mb-1.5 flex items-center'}>
                  <span className={'mr-1'}>
                    <Image src={'/usdc.png'} alt={'usdc'} width={16} height={16} />
                  </span>
                  {/* TODO: add platform fee for creator */}
                  <span className={'leading-none'}>
                    {formatUnits(isWinner ? winnerPayout : entryAmount, 6)}
                  </span>
                </div>
                <Link href={`https://sepolia.basescan.org/tx/${log.transactionHash}`}>
                  <div className={'flex items-center gap-1'}>
                    <p className='text-xs leading-none'>{formattedAddress}</p>
                    <ExternalLink size={12} />
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
