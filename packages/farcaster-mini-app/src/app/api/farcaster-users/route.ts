import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ALLOWED_ORIGINS } from '@/lib/constants';
import { isAddress } from 'viem';
import { getFarcasterUsersByAddresses } from '@/lib/neynar/getFarcasterUsersByAddresses';
import type { FUser } from "@/types/neynar";

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const origin: string | null = headersList.get('Origin');
    console.log('Request origin:', origin);

    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    const { addresses } = await req.json();
    console.log('Received addresses:', addresses);

    if (!Array.isArray(addresses) || !addresses.length) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    for (const address of addresses) {
      if (!isAddress(address)) {
        return NextResponse.json({ error: `Invalid address: ${address}` }, { status: 400 });
      }
    }

    const users = await getFarcasterUsersByAddresses(addresses.filter(addr => !!addr).map(addr => addr.toLowerCase()));

    if (!users || Object.keys(users).length === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    const usersMap: Record<string, FUser> = {};

    for (const key of Object.keys(users)) {
      const user = users[key][0];
      usersMap[key] = { fid: user.fid, username: user.username, display_name: user.display_name };
    }

    return NextResponse.json({ success: true, users: usersMap });
  } catch (error) {
    console.error('Error in get farcaster users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
