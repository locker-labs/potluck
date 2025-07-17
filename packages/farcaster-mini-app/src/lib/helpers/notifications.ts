import { contractAddress, abi as potluckAbi } from '@/config';
import { publicClient } from '@/clients/viem';
import { readContract } from 'viem/actions';
import type { Address } from 'viem';
import {
    getUserFidsByAddresses,
    getUserFidsByAddressesAndWinner,
    sendApprovalNotification,
    sendDepositReminderNotification,
    sendInviteNotification
} from '@/lib/neynar';

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