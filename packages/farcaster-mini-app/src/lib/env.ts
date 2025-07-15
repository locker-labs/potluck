// Client-side environment variables (available in browser)
const clientEnv: Record<string, string> = {};

// Server-side environment variables (only available on server)
const serverEnv: Record<string, string> = {
	NEYNAR_API_KEY: process.env.NEYNAR_API_KEY ?? "",
	NEYNAR_WEBHOOK_URL: process.env.NEYNAR_WEBHOOK_URL ?? "",
};

// Validate client-side variables
for (const [key, value] of Object.entries(clientEnv)) {
	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}
}

// Validate server-side variables only on the server
if (typeof window === "undefined") {
	for (const [key, value] of Object.entries(serverEnv)) {
		if (!value) {
			throw new Error(`Missing environment variable: ${key}`);
		}
	}
}

// Combine all environment variables
const env: Record<string, string> = {
	...clientEnv,
	...serverEnv,
};

console.log("env");
console.log(env);
export { env };
