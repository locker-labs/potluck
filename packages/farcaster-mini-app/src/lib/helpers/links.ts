import { MINI_APP_URL } from '@/lib/constants';

export const getProfileLink = (address: string) => {
  return `${MINI_APP_URL}/profile/${address}`;
};