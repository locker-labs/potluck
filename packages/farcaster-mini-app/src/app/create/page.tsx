import type { Metadata } from 'next';
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from '@/lib/constants';
import { getFrameEmbedMetadata } from '@/lib/utils';
import CreatePotPage from '@/components/pages/CreatePotPage';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: APP_NAME,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [APP_OG_IMAGE_URL],
    },
    twitter: {
      card: 'summary_large_image',
      title: APP_NAME,
      description: APP_DESCRIPTION,
      creator: '@locker_money',
      images: [
        {
          url: APP_OG_IMAGE_URL,
          width: 800,
          height: 600,
          alt: 'twitterimage',
        },
      ],
    },
    other: {
      'fc:frame': JSON.stringify(getFrameEmbedMetadata({ pathname: '/create' })),
    },
  };
}

export default function Create() {
  return <CreatePotPage />;
}
