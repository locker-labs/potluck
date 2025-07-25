export interface IAccountAssociation {
  header: string;
  payload: string;
  signature: string;
}

/**
 * Publishing Mini App - How to generate an account association
 * 1. Go to https://farcaster.xyz/~/developers/mini-apps/manifest
 * 2. Enter your domain
 * 3. Click "Generate account association"
 * 4. Add an entry to this accountAssociations object with a key
 * 5. Add the key in Environment Variable ACCOUNT_ASSOCIATION_ID in vercel for a specific branch and environment
 * 6. Push code to trigger a new deployment
 */

export const accountAssociations: Record<string, IAccountAssociation> = {
  dev: {
    header:
      'eyJmaWQiOjM3NzM5MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDU5NDg3ZDIxOWRkMDc5NUFiZDM4YzU1MTVFMjdlNzQxOEViODExNkIifQ',
    payload: 'eyJkb21haW4iOiJwb3RsdWNrLWRldi52ZXJjZWwuYXBwIn0',
    signature:
      'MHhiYjExNTY2ZDhjY2E4YzNiZTgyNDM1Njk0ODYyMTc4ZTBlODA1M2Y5NjI4NzQxNmMxY2M4YTY0ZmE1NWZhNDY3MzY3MmY5N2Q1NWE1OTdlNmUyMTI5ZjI2MmY4MDc5MjQ0ZTg2NjNkMzViZWIyNDBhY2M3Yzc5YjUyMmVjNTc2MjFj',
  },
  test: {
    header: "eyJmaWQiOjEwODkxNjUsInR5cGUiOiJhdXRoIiwia2V5IjoiMHg5ZjRDY0M2NjAwODVCODc1QzNlNWU5Mjg1OWU1MkFjMEMzMUM5ZjQxIn0",
    payload: "eyJkb21haW4iOiJwb3RsdWNrLWdpdC1mZWF0LW5vdGlmaWNhdGlvbnMtMi1sb2NrZXItbW9uZXkudmVyY2VsLmFwcCJ9",
    signature: "pS02xsUOu5duacv/AcZcHeOPgfXb1dTd9MKERMYVdRFM8ogV66mp3INwyOgjnB76v4dgDYwAexI2ycgLq6m3eRw="
  },
};
