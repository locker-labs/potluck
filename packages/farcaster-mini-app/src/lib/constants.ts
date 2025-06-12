import { chainId } from '@/config';

if (!process.env.NEXT_PUBLIC_URL) {
  throw new Error('NEXT_PUBLIC_URL environment variable is not set.');
}

if (!process.env.NEXT_PUBLIC_MINI_APP_URL) {
  throw new Error('NEXT_PUBLIC_MINI_APP_URL environment variable is not set.');
}

if (!process.env.NEXT_PUBLIC_RPC_URL) {
  throw new Error('NEXT_PUBLIC_RPC_URL environment variable is not set.');
}

export const APP_URL = process.env.NEXT_PUBLIC_URL;
export const APP_NAME = process.env.NEXT_PUBLIC_FRAME_NAME;
export const APP_SUBTITLE = process.env.NEXT_PUBLIC_FRAME_SUBTITLE;
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_FRAME_DESCRIPTION;
export const APP_PRIMARY_CATEGORY = process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY;
export const APP_TAGS = process.env.NEXT_PUBLIC_FRAME_TAGS?.split(',');
export const APP_ICON_URL = `${APP_URL}/icon.png`;
export const APP_OG_IMAGE_URL = `${APP_URL}/og.png`;
export const APP_SPLASH_URL = `${APP_URL}/splash.png`;
export const APP_SPLASH_BACKGROUND_COLOR = '#111827';
export const APP_BUTTON_TEXT = process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT;
export const APP_CHAIN_LIST = [`eip155:${chainId}`];
export const APP_REQUIRED_CAPABILITIES = [
  'wallet.getEthereumProvider',
  'actions.ready',
  'actions.openUrl',
  'actions.close',
  'actions.addMiniApp',
  'actions.composeCast',
  'back',
];

export const MINI_APP_URL = process.env.NEXT_PUBLIC_MINI_APP_URL;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
