const requiredEnvs = ['PAYOUT_PRIVATE_KEY'] as const;

type EnvKey = (typeof requiredEnvs)[number];
type EnvVars = Record<EnvKey, string>;

// Validate required environment variables
const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);

if (missingEnvs.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvs.join(', ')}`);
}

// Create a simple object with the environment variables
const env = requiredEnvs.reduce((acc, key) => {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  acc[key] = value;
  return acc;
}, {} as EnvVars);

export { env };
