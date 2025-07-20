import type { Metadata } from 'next';
import PotPage from '@/components/pages/PotPage';
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from '@/lib/constants';
import { getFrameEmbedMetadata } from '@/lib/utils';
import { fetchPot, potMapper } from '@/lib/helpers/contract';
import type { TPot, TPotObject } from '@/lib/types';

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pot: TPot = await fetchPot(BigInt(id));
  const potObject: TPotObject = potMapper(pot, []);

  return {
    title: `Save with me for a chance to win ${potObject.totalPool} USDC`,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [APP_OG_IMAGE_URL],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Save with me for a chance to win ${potObject.totalPool} USDC`,
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
      'fc:frame': JSON.stringify(getFrameEmbedMetadata({ pathname: `/pot/${id}` })),
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!id) return null;

  return <PotPage id={id} />;
}
