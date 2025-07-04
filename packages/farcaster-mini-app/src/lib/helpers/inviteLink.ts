import { MINI_APP_URL } from '@/lib/constants';

export function getInviteLink(potId: bigint): string {
  return `${MINI_APP_URL}/pot/${potId}`;
}
