import { neynarClient as client } from "./client";
import { APP_URL } from "@/lib/constants";

type TNotification = { title: string; body: string; target_url: string };

// Reminder to deposit tokens in next round/join round, with winner announcement
export async function sendDepositReminderNotification({ potId, targetFids, winnerName }: { potId: number; targetFids: number[]; winnerName?: string }) {
  let body = "Deposit tokens to join the next round!";
  if (winnerName) {
    body += `\nWinner: ${winnerName}`;
  }
  const notification: TNotification = {
    title: "New round started",
    body,
    target_url: `${APP_URL}/pot/${potId}`,
  };

  // TODO: remove this console log in production
  console.log(`targetFids: ${targetFids}\nnotification: ${JSON.stringify(notification)}`);

  try {
    const response = await client.publishFrameNotifications({
      targetFids,
      filters: {},
      notification,
    });
    return response;
  } catch (error) {
    console.error("Failed to send deposit reminder notification:", error);
    throw error;
  }
}

// You have been approved, join pot now
export async function sendApprovalNotification({ potId, targetFids }: { potId: number; targetFids: number[] }) {
  const notification: TNotification = {
    title: "Pot Approval",
    body: "You have been approved! Join the pot now.",
    target_url: `${APP_URL}/pot/${potId}`,
  };
  try {
    const response = await client.publishFrameNotifications({
      targetFids,
      filters: {},
      notification,
    });
    return response;
  } catch (error) {
    console.error("Failed to send approval notification:", error);
    throw error;
  }
}

// Pot creation details
export async function sendPotCreationNotification({ potId, targetFids }: { potId: number; targetFids: number[] }) {
  const notification: TNotification = {
    title: "Pot Created",
    body: `Your pot has been created! Pot ID: ${potId}`,
    target_url: `${APP_URL}/pot/${potId}`,
  };
  try {
    const response = await client.publishFrameNotifications({
      targetFids,
      filters: {},
      notification,
    });
    return response;
  } catch (error) {
    console.error("Failed to send pot creation notification:", error);
    throw error;
  }
}

export async function sendInviteNotification({ potId, targetFids }: { potId: number; targetFids: number[] }) {
    const notification: TNotification = {
        title: "Pot Invitation",
        body: "You have been invited to join a Pot. Click to participate!",
        target_url: `${APP_URL}/pot/${potId}`,
    };

    try {
        const response = await client.publishFrameNotifications({
        targetFids,
        filters: {}, // No filters, broadcast to all
        notification,
        });
        return response;
    } catch (error) {
        console.error("Failed to send invite notification:", error);
        throw error;
    }
}

export async function sendRequestNotification({ potId, potName, requesterUsername, creatorFid }: { potId: number; potName: string; requesterUsername: string; creatorFid: number }) {
    const notification: TNotification = {
        title: "Join Request",
        body: `${requesterUsername} has requested to join ${potName}. Click to approve!`,
        target_url: `${APP_URL}/pot/${potId}`,
    };

    try {
        const response = await client.publishFrameNotifications({
            targetFids: [creatorFid],
            filters: {}, // No filters, broadcast to all
            notification,
        });
        return response;
    } catch (error) {
        console.error("Failed to send request notification:", error);
        throw error;
    }
}

export async function sendFarcasterNotification(targetFids: number[], notification: TNotification) {
  if (targetFids.length === 0) {
    throw new Error("No target FIDs provided for notification");
  }

  const filters = {}; // No filters, target only the single fid
  try {
    const response = await client.publishFrameNotifications({ targetFids, filters, notification });
    return response;
  } catch (error) {
    console.error("Failed to send notification:", error);
    throw error;
  }
}