import { env } from "@/lib/env";

interface User {
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
}

interface BulkUsersByAddressResponse {
  [address: string]: User[];
}

/**
 * Fetches Farcaster users by their Ethereum addresses and returns a list of FIDs along with the winner's username
 * @param addresses - Array of Ethereum addresses to look up
 * @returns Promise<number[]> - Array of FIDs found for the given addresses
 */
export async function getUserFidsByAddressesAndWinner(
  addresses: string[],
): Promise<{  fids: number[], winnerUsername?: string }> {

  // Validate input: addresses
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error("No addresses provided for FID lookup");
  }

  const baseUrl = 'https://api.neynar.com/v2/farcaster/user/bulk-by-address';

  // Build query parameters
  const params = new URLSearchParams({
    addresses: addresses.join(',')
  });

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
    console.log('Fetched users by addresses:', data);
    
    // Extract all FIDs from the response
    const fids: number[] = [];
    
    for (const address in data) {
      const users = data[address];
      if (Array.isArray(users)) {
        for (const user of users) {
          if (user.fid && !fids.includes(user.fid)) {
            fids.push(user.fid);
          }
        }
      }
    }

    // assuming the first address is the winner
    const winnerAddress = addresses[0];
    console.log('winnerAddress', winnerAddress);
    
    return { fids, winnerUsername: data[winnerAddress]?.[0]?.username };
    
  } catch (error) {
    console.error('Error fetching users by addresses:', error);
    throw error;
  }
}
