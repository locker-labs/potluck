import { toast } from 'sonner';
import { generateRandomCast } from '@/lib/helpers/cast';
import { formatUnits } from 'viem';

export function useCreateCast({
  potId,
  period,
  amount,
}: {
  potId: bigint | null;
  period: bigint;
  amount: bigint;
}) {
  const handleCastOnFarcaster = () => {
    if (!potId) {
      toast.error('Pot ID is not available. Please create a pot first.');
      return;
    }
    const castText = generateRandomCast(Number(formatUnits(amount ?? 0n, 6)), period ?? 0n, potId);
    // Open Warpcast in a new tab with pre-filled message
    const warpcastUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(castText)}`;
    window.open(warpcastUrl, '_blank');
  };

  return { handleCastOnFarcaster };
}
