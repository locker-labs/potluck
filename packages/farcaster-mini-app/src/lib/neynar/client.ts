import { env } from "@/lib/env";

import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";

const config = new Configuration({
	apiKey: env.NEYNAR_API_KEY,
});

export const neynarClient = new NeynarAPIClient(config);
