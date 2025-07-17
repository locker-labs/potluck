import { contractAddress, abi as potluckAbi } from '@/config';
import { publicClient } from '@/clients/viem';
import { readContract } from 'viem/actions';
import type { Address } from 'viem';
import { getUserFidsByAddressesAndWinner, sendDepositReminderNotification } from '@/lib/neynar';

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
        console.log(`No FIDs found for pot #${potId}. Skipping payout.`);
        return;
    }

    console.log(`Sending deposit reminder notification for pot #${potId}`);
    await sendDepositReminderNotification({ potId: Number(potId), targetFids: fids, winnerName: winnerUsername });
}