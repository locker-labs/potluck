import { env } from "@/lib/env";
import type { TFarcasterUser } from "../types";

interface BulkUsersByAddressResponse {
  [address: string]: TFarcasterUser[];
}

/**
 * Fetches Farcaster users by their Ethereum addresses
 * @param addresses - Array of Ethereum addresses to look up
 * @param addressTypes - Optional array specifying which address types to search ('custody_address' | 'verified_address')
 * @param viewerFid - Optional FID of the viewer for context
 * @returns Promise<TFarcasterUser[]> - Array of TFarcasterUsers found for the given addresses
 */
export async function getBulkFUsersByAddresses(
  addresses: string[],
  addressTypes?: ('custody_address' | 'verified_address')[],
  viewerFid?: number
): Promise<BulkUsersByAddressResponse> {
  const baseUrl = 'https://api.neynar.com/v2/farcaster/user/bulk-by-address';
  
  // Build query parameters
  const params = new URLSearchParams({
    addresses: addresses.join(',')
  });
  
  if (addressTypes && addressTypes.length > 0) {
    params.append('address_types', addressTypes.join(','));
  }
  
  if (viewerFid) {
    params.append('viewer_fid', viewerFid.toString());
  }
  
  const url = `${baseUrl}?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': env.NEYNAR_API_KEY,
        'x-neynar-experimental': 'false'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data: BulkUsersByAddressResponse = await response.json();

    return data;
    
  } catch (error) {
    console.error('Error fetching users by addresses:', error);
    throw error;
  }
}
