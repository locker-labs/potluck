import { useState, useEffect } from 'react';
import type { TPotObject } from "@/lib/types";
import type { Address } from "viem";
import { Loader2 } from 'lucide-react';
import { useJoinPot } from '@/hooks/useJoinPot';
import { useAccount } from 'wagmi';
import { getPotsByUser } from "@/lib/graphQueries";
import { motion } from "motion/react";
import { YourPotCard } from '@/components/subcomponents/YourPotsCard';
import { SectionHeading } from '@/components/ui/SectionHeading';

let _fetchPotsEffectFlag = true; // prevent multiple fetches

export default function YourPots({ type, creator }: { type: 'created' | 'joined', creator?: Address }) {
  const { handleJoinPot, joiningPotId, joinedPotId, tokenBalance } =
    useJoinPot();
  const {
    address: addressWithCheckSum,
    isConnected,
  } = useAccount();
  const address = addressWithCheckSum?.toLowerCase() as Address | undefined;

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

  // Get logs from contract on mount
  useEffect(() => {
    if (type === 'joined') {
      if (!address) return;
    } else if (type === 'created') {
      if (!creator) return;
    }

    if (!_fetchPotsEffectFlag) {
      console.log("Skipping fetch pots effect as it has already run.");
      return;
    }
    _fetchPotsEffectFlag = false;

    (async () => {
      let pots: TPotObject[] = [];
      try {
        if (type === 'joined') {
          pots = await getPotsByUser(address as Address);
        } else if (type === 'created') {
          // TODO: add a param in getPotsByUser to fetch only created pots
          pots = await getPotsByUser(creator as Address);
        }
      } catch (error) {
        console.error("Error fetching pots by user:", error);
      }
      setPots((prevPots) => [...prevPots, ...pots]);
      setLoading(false);
      _fetchPotsEffectFlag = true;
    })();
  }, [address, type, creator]);

  // ---------
  // RENDERING
  // ---------

  const isCreator =
    type === "created" &&
    !!creator &&
    !!address &&
    creator.toLowerCase() === address.toLowerCase();

  if (type === 'created' && !creator) {
    return null; // No creator provided for fetching created pots
  }

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
      animate={{ opacity: 1, y: 0, height: 280 }}
      exit={{ opacity: 0, y: -40, height: 0 }}
      transition={{ duration: 0.4, ease: ["easeOut", "easeIn"] }}
      style={{ overflow: "hidden" }}
      key="your-pots"
    >
      <div>
        <SectionHeading className={'mx-4'}>{type === "joined" ? "Active" : isCreator ? "My" : "Created"} Pots</SectionHeading>
        <div className="px-4 flex flex-row overflow-x-scroll gap-[12px] md:grid-cols-2 lg:grid-cols-3">
          {pots.map((pot: TPotObject) => (
            <YourPotCard
              key={pot.id}
              pot={pot}
              joiningPotId={joiningPotId}
              joinedPotId={joinedPotId}
              handleJoinPot={handleJoinPot}
              address={address}
              className={pots.length === 1 ? "w-full" : ""}
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