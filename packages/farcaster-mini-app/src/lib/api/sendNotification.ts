import type { ENotificationType } from "@/enums/notification";
import type { Address } from "viem";

type SendNotificationParams = {
	addresses: Address[];
	potId: bigint | string;
	type: ENotificationType;
};

export async function sendNotification({
	addresses,
	potId,
	type,
}: SendNotificationParams): Promise<{ success?: boolean; error?: string }> {
	const res = await fetch("/api/notify", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			addresses,
			potId: String(potId),
			type,
		}),
	});

	const data = await res.json();

	if (!res.ok) {
		console.error("Failed to send notification:", data.error);
		return { error: data.error || "Failed to send notification" };
	}

	return { success: true };
}
