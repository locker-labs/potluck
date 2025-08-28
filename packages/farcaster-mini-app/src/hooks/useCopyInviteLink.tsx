import { useState } from 'react';
import { toast } from 'sonner';
import { getInviteLink } from '@/lib/helpers/links';

export function useCopyInviteLink({
  potId,
}: {
  potId: bigint | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (potId === null) {
      toast.error('Pot ID is not available. Please create a pot first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(getInviteLink(potId));
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link');
    }
  };

  return { handleCopyLink, copied };
}
