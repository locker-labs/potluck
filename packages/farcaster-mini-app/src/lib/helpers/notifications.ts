import { contractAddress, abi as potluckAbi } from '@/config';
import { publicClient } from '@/clients/viem';
import { ENotificationType } from '@/enums/notification';
import { readContract } from 'viem/actions';
import type { Address } from 'viem';
import {
    getFarcasterUsersByAddresses,
    getUserFidsByAddresses,
    getUserFidsByAddressesAndWinner,
    sendApprovalNotification,
    sendDepositReminderNotification,
    sendInviteNotification,
    sendRequestNotification
} from '@/lib/neynar';
import {fetchPotMiniInfo} from "@/lib/graphQueries";
import type { TPotObjectMini } from "@/lib/types";
import type {BulkUsersByAddressResponse, FUser} from "@/types/neynar";
import { formatAddress } from '../address';

export async function sendReminderNotificationForPot(potId: bigint) {
    console.log(`Processing pot #${potId} for reminder notification`);


    console.log(`Fetching participants for pot #${potId}`);
    const participants = await readContract(publicClient, {
        address: contractAddress,
        abi: potluckAbi,
        functionName: 'getParticipants',
        args: [potId],
    }) as Address[];
    console.log(`Fetched participants for pot #${potId}:`, participants);

    let fids: number[] = [];
    let winnerUsername: string | undefined;

    if (Array.isArray(participants) && participants.length > 0) {
        try {
            console.log('Fetching fids and winner username for participants');
            const response = await getUserFidsByAddressesAndWinner(participants.map(addr => addr.toLowerCase()));

            fids = response.fids;
            winnerUsername = response.winnerUsername;
        
            console.log('Fetched fids:', fids);
            console.log('Winner:', winnerUsername);
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error fetching FIDs:', error.message);
            } else {
            console.error('Unexpected error fetching FIDs:', error);
            }
        }
    }

    if (fids.length === 0) {
        console.log(`No FIDs found for pot #${potId}. Skipping reminder notification.`);
        return;
    }

    console.log(`Sending deposit reminder notification for pot #${potId}`);
    await sendDepositReminderNotification({ potId: Number(potId), targetFids: fids, winnerName: winnerUsername });
}

/**
  * Sends an invite notification for a pot to the specified addresses.
  *
  * @param potId - The ID of the pot to send the invite for
  * @param addresses - Array of addresses to send the invite notification to
  *
  * @returns Promise<void>
  */
export async function sendInviteNotificationForPot(potId: bigint, addresses: Address[]): Promise<void> {
    console.log(`Processing pot #${potId} for invite notification`);

    if (!addresses || addresses.length === 0) {
        console.log(`No addresses provided for pot #${potId}. Skipping invite notification.`);
        return;
    }

    let fids: number[] = [];

    try {
        console.log('Fetching fids for addresses:', addresses);
        fids = await getUserFidsByAddresses(addresses.map(addr => addr.toLowerCase()));
        console.log('Fetched fids:', fids);
    } catch (error) {
        console.error(`Error fetching FIDs for pot #${potId}:`, error);
        return;
    }

    if (fids.length === 0) {
        console.log(`No FIDs found for pot #${potId}. Skipping invite notification.`);
        return;
    }

    try {
        console.log('Sending invite notification...');
        await sendInviteNotification({ potId: Number(potId), targetFids: fids });
        console.log('Invite notification sent successfully');
    } catch (error) {
        console.error(`Failed to send invite notification for pot #${potId}:`, error);
    }
}


/**
  * Sends an approve notification for a pot to the specified addresses.
  *
  * @param potId - The ID of the pot to send the notification for
  * @param addresses - Array of addresses to send the approve notification to
  *
  * @returns Promise<void>
  */
export async function sendApproveNotificationForPot(potId: bigint, addresses: Address[]): Promise<void> {
    console.log(`Processing pot #${potId} for approve notification`);

    if (!addresses || addresses.length === 0) {
        console.log(`No addresses provided for pot #${potId}. Skipping approve notification.`);
        return;
    }

    let fids: number[] = [];

    try {
        console.log('Fetching fids for addresses:', addresses);
        fids = await getUserFidsByAddresses(addresses.map(addr => addr.toLowerCase()));
        console.log('Fetched fids:', fids);
    } catch (error) {
        console.error(`Error fetching FIDs for pot #${potId}:`, error);
        return;
    }

    if (fids.length === 0) {
        console.log(`No FIDs found for pot #${potId}. Skipping approve notification.`);
        return;
    }

    try {
        console.log('Sending approve notification...');
        await sendApprovalNotification({ potId: Number(potId), targetFids: fids });
        console.log('Approve notification sent successfully');
    } catch (error) {
        console.error(`Failed to send approve notification for pot #${potId}:`, error);
    }
}

/**
 * Sends a join request notification to the pot creator.
 *
 * @param potId - The ID of the pot to send the notification for
 * @param addresses - Array of addresses. The first address is the requestor
 *
 * @returns Promise<void>
 */
export async function sendRequestNotificationForPot(potId: bigint, addresses: Address[]): Promise<void> {
    console.log(`Processing pot #${potId} for request notification`);

    // Check if the pot exists
    const pot: TPotObjectMini = await fetchPotMiniInfo(potId);
    if (!pot) {
        console.warn(`No pot found for pot #${potId}. Skipping request notification.`);
        return;
    }

    // list of addresses to fetch farcaster users
    const addressList = [pot.creator];
    let requesterUsername = 'Someone';
    // target fids
    const fids: number[] = [];

    if (addresses.length > 0) {
        requesterUsername = formatAddress(addresses[0]);
        // adding requestor to address list
        addressList.push(addresses[0]);
    }

    try {
        console.log('Fetching fids for addresses:', addressList);
        const userMap: BulkUsersByAddressResponse = await getFarcasterUsersByAddresses(addressList.map(addr => addr.toLowerCase()));

        // get creator fid
        if (userMap?.[pot.creator.toLowerCase()]) {
            const creator: FUser = userMap[pot.creator.toLowerCase()]?.[0];
            if (creator) {
                fids.push(creator.fid);
            } else {
                console.warn(`Fid not found for pot creator ${pot.creator.toLowerCase()}`);
                return;
            }
        } else {
            console.warn(`Fid not found for pot creator ${pot.creator.toLowerCase()}`);
            return;
        }

        // get requestor name
        if (addresses.length > 0) {
            if (userMap?.[addresses[0].toLowerCase()]) {
                const requestor: FUser = userMap[addresses[0].toLowerCase()]?.[0];
                if (requestor) {
                    requesterUsername = requestor.username;
                }
            }
        }

        console.log('Fetched fids:', fids);
    } catch (error) {
        console.error(`Error fetching FIDs for pot #${potId}:`, error);
        return;
    }

    if (fids.length === 0) {
        console.log(`No FIDs found for pot #${potId}. Skipping request notification.`);
        return;
    }

    try {
        console.log('Sending request notification...');
        await sendRequestNotification({ potId: Number(potId), creatorFid: fids[0], requesterUsername, potName: pot.name });
        console.log('Request notification sent successfully');
    } catch (error) {
        console.error(`Failed to send request notification for pot #${potId}:`, error);
    }
}

export async function sendNotificationForPot(
  potId: bigint,
  addresses: Address[],
  type: ENotificationType
): Promise<void> {
  switch (type) {
    case ENotificationType.INVITE:
      await sendInviteNotificationForPot(potId, addresses);
      break;
    case ENotificationType.APPROVE:
      await sendApproveNotificationForPot(potId, addresses);
      break;
    case ENotificationType.REQUEST:
      await sendRequestNotificationForPot(potId, addresses);
      break;
    default:
      console.error(`Unsupported notification type: ${type}`);
  }
}