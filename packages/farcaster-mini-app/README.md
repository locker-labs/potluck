<!-- generated by @neynar/create-farcaster-mini-app version 1.3.0 -->

# Farcaster Mini Apps (formerly Frames) Quickstart by Neynar 🪐

A Farcaster Mini Apps quickstart npx script.

This is a [NextJS](https://nextjs.org/) + TypeScript + React app.

## Guide

Check out [this Neynar docs page](https://docs.neynar.com/docs/create-farcaster-miniapp-in-60s) for a simple guide on how to create a Farcaster Mini App in less than 60 seconds!

## Getting Started

To create a new mini app project, run:
```{bash}
npx @neynar/create-farcaster-mini-app@latest
```

To run the project:
```{bash}
cd <PROJECT_NAME>
npm run dev
```

### Importing the CLI
To invoke the CLI directly in JavaScript, add the npm package to your project and use the following import statement:
```{javascript}
import { init } from '@neynar/create-farcaster-mini-app';
```

## Deploying to Vercel
For projects that have made minimal changes to the quickstart template, deploy to vercel by running:
```{bash}
npm run deploy:vercel
```

## Building for Production

To create a production build, run:
```{bash}
npm run build
```

The above command will generate a `.env` file based on the `.env.local` file and user input. Be sure to configure those environment variables on your hosting platform.

## Account Associations

Account associations are used for Farcaster frame authentication. This app supports multiple account associations for different environments (dev, prod, staging, etc.).

### How Account Associations Work

Account associations are stored in `src/lib/accountAssociations.ts` as a simple object with different environment keys:

```typescript
export const accountAssociations: Record<string, IAccountAssociation> = {
  dev: {
    header: "eyJmaWQiOjM3NzM5MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDU5NDg3ZDIxOWRkMDc5NUFiZDM4YzU1MTVFMjdlNzQxOEViODExNkIifQ",
    payload: "eyJkb21haW4iOiJwb3RsdWNrLWRldi52ZXJjZWwuYXBwIn0",  
    signature: "MHhiYjExNTY2ZDhjY2E4YzNiZTgyNDM1Njk0ODYyMTc4ZTBlODA1M2Y5NjI4NzQxNmMxY2M4YTY0ZmE1NWZhNDY3MzY3MmY5N2Q1NWE1OTdlNmUyMTI5ZjI2MmY4MDc5MjQ0ZTg2NjNkMzViZWIyNDBhY2M3Yzc5YjUyMmVjNTc2MjFj"
  }
  // Add more environments here
};
```

### Adding a New Account Association

1. **Generate the account association data** through the Farcaster developer UI or other tooling
2. **Add it to the `accountAssociations` object** in `src/lib/accountAssociations.ts`:

```typescript
export const accountAssociations: Record<string, IAccountAssociation> = {
  dev: {
    // existing dev association...
  },
  prod: {
    header: "your_production_header_here",
    payload: "your_production_payload_here", 
    signature: "your_production_signature_here"
  },
  staging: {
    header: "your_staging_header_here",
    payload: "your_staging_payload_here",
    signature: "your_staging_signature_here" 
  }
};
```

### Environment Variable Configuration

Set the `ACCOUNT_ASSOCIATION_ID` environment variable to specify which account association to use:

```bash
# For development (default)
ACCOUNT_ASSOCIATION_ID=dev

# For production
ACCOUNT_ASSOCIATION_ID=prod

# For staging
ACCOUNT_ASSOCIATION_ID=staging
```

If `ACCOUNT_ASSOCIATION_ID` is not set, it defaults to `dev`. If the specified ID doesn't exist in the `accountAssociations` object, the app will log a warning and return null (no account association).

### Local Development

For local development, add the environment variable to your `.env.local` file:

```bash
# .env.local
ACCOUNT_ASSOCIATION_ID=dev
```

### Production Deployment

When deploying to production platforms like Vercel, set the environment variable in your deployment configuration:
- **Vercel**: Set `ACCOUNT_ASSOCIATION_ID=prod` in your project's environment variables
- **Other platforms**: Follow the platform's documentation for setting environment variables

## Developing Script Locally

This section is only for working on the script and template. If you simply want to create a mini app and _use_ the template, this section is not for you.

### Recommended: Using `npm link` for Local Development

To iterate on the CLI and test changes in a generated app without publishing to npm:

1. In your installer/template repo (this repo), run:
   ```bash
   npm link
   ```
   This makes your local version globally available as a symlinked package.


1. Now, when you run:
   ```bash
   npx @neynar/create-farcaster-mini-app
   ```
   ...it will use your local changes (including any edits to `init.js` or other files) instead of the published npm version.

### Alternative: Running the Script Directly

You can also run the script directly for quick iteration:

```bash
node ./bin/index.js
```

However, this does not fully replicate the npx install flow and may not catch all issues that would occur in a real user environment.

### Environment Variables and Scripts

If you update environment variable handling, remember to replicate any changes in the `dev`, `build`, and `deploy` scripts as needed. The `build` and `deploy` scripts may need further updates and are less critical for most development workflows.

