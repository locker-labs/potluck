import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sendNotificationForPot } from '@/lib/helpers/notifications';
import { ENotificationType } from '@/enums/notification';
import { headers } from 'next/headers';
import { ALLOWED_ORIGINS } from '@/lib/constants';
import { isAddress } from 'viem';

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const origin: string | null = headersList.get('Origin');
    console.log('Request origin:', origin);

    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    const { addresses, potId, type } = await req.json();

    if (!Array.isArray(addresses) || !addresses.length || typeof potId !== 'string' || !Object.values(ENotificationType).includes(type)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    for (const address of addresses) {
      if (!isAddress(address)) {
        return NextResponse.json({ error: `Invalid address: ${address}` }, { status: 400 });
      }
    }

    await sendNotificationForPot(BigInt(potId), addresses, type);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notification API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
