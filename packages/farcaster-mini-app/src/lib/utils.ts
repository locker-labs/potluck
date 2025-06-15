import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { privateKeyToAccount } from 'viem/accounts';
import {
  APP_BUTTON_TEXT,
  APP_SUBTITLE,
  APP_DESCRIPTION,
  APP_ICON_URL,
  APP_NAME,
  APP_OG_IMAGE_URL,
  APP_PRIMARY_CATEGORY,
  APP_SPLASH_BACKGROUND_COLOR,
  APP_TAGS,
  APP_URL,
  APP_CHAIN_LIST,
  APP_REQUIRED_CAPABILITIES,
} from './constants';
import { APP_SPLASH_URL } from './constants';

interface FrameMetadata {
  version: string;
  name: string;
  subtitle?: string;
  iconUrl: string;
  homeUrl: string;
  imageUrl?: string;
  buttonTitle?: string;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  webhookUrl?: string;
  description?: string;
  primaryCategory?: string;
  tags?: string[];
  tagline?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  requiredChains?: string[];
  requiredCapabilities?: string[];
}

interface FrameManifest {
  accountAssociation?: {
    header: string;
    payload: string;
    signature: string;
  };
  frame: FrameMetadata;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSecretEnvVars() {
  const privateKey = process.env.PRIVATE_KEY;
  const fid = process.env.FID;

  if (!privateKey || !fid) {
    return null;
  }

  return { privateKey, fid };
}

export function getFrameEmbedMetadata(options?: { ogImageUrl?: string; pathname?: string }) {
  const ogImageUrl = options?.ogImageUrl ?? '';
  const pathname = options?.pathname ?? '';
  let buttonTitle = APP_BUTTON_TEXT;
  if (pathname?.includes('/pot/')) {
    buttonTitle = 'Join Pot';
  }
  return {
    version: 'next',
    imageUrl: ogImageUrl ?? APP_OG_IMAGE_URL,
    button: {
      title: buttonTitle,
      action: {
        type: 'launch_frame',
        name: APP_NAME,
        url: `${APP_URL}${pathname}`,
        splashImageUrl: APP_SPLASH_URL,
        iconUrl: APP_ICON_URL,
        splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
        description: APP_DESCRIPTION,
        primaryCategory: APP_PRIMARY_CATEGORY,
        tags: APP_TAGS,
      },
    },
  };
}

export async function getFarcasterMetadata(): Promise<FrameManifest> {
  // First check for FRAME_METADATA in .env and use that if it exists
  if (process.env.FRAME_METADATA) {
    try {
      const metadata = JSON.parse(process.env.FRAME_METADATA);
      console.log('Using pre-signed frame metadata from environment');
      return metadata;
    } catch (error) {
      console.warn('Failed to parse FRAME_METADATA from environment:', error);
    }
  }

  if (!APP_URL) {
    throw new Error('NEXT_PUBLIC_URL not configured');
  }

  // Get the domain from the URL (without https:// prefix)
  const domain = new URL(APP_URL).hostname;
  console.log('Using domain for manifest:', domain);

  const secretEnvVars = getSecretEnvVars();
  if (!secretEnvVars) {
    console.warn(
      'No private key or FID found in environment variables -- generating unsigned metadata',
    );
  }

  let accountAssociation;
  if (secretEnvVars) {
    // Generate account from private key
    const account = privateKeyToAccount(secretEnvVars.privateKey as `0x${string}`);
    const custodyAddress = account.address;

    const header = {
      fid: Number.parseInt(secretEnvVars.fid),
      type: 'custody',
      key: custodyAddress,
    };
    const encodedHeader = Buffer.from(JSON.stringify(header), 'utf-8').toString('base64');

    const payload = {
      domain,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');

    const signature = await account.signMessage({
      message: `${encodedHeader}.${encodedPayload}`,
    });
    const encodedSignature = Buffer.from(signature, 'utf-8').toString('base64url');

    accountAssociation = {
      header: encodedHeader,
      payload: encodedPayload,
      signature: encodedSignature,
    };
  }

  return {
    accountAssociation,
    frame: {
      version: '1',
      name: APP_NAME ?? 'Frames v2 Demo',
      iconUrl: APP_ICON_URL,
      homeUrl: APP_URL,
      imageUrl: APP_OG_IMAGE_URL,
      subtitle: APP_SUBTITLE,
      buttonTitle: APP_BUTTON_TEXT ?? 'Launch Frame',
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      description: APP_DESCRIPTION,
      primaryCategory: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
      tagline: APP_DESCRIPTION,
      ogTitle: APP_NAME,
      ogDescription: APP_DESCRIPTION,
      ogImageUrl: APP_OG_IMAGE_URL,
      requiredChains: APP_CHAIN_LIST,
      requiredCapabilities: APP_REQUIRED_CAPABILITIES,
    },
  };
}
