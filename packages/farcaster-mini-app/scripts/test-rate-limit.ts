"use server"

import { getUserFidsByAddresses } from "@/lib/neynar/getUserFidsByAddresses";

const start = Date.now();
let successCount = 0;

for (let i = 0; i < 100; i++) {
  const a = Date.now();
  try {
    await getUserFidsByAddresses(["0x9f4CcC660085B875C3e5e92859e52Ac0C31C9f41"]);
    console.log('successful requests', ++successCount);
  } catch {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.error('Error fetching user FIDs');
  }
  const b = Date.now();
  console.log('time:', b-start, 'ms', '-- request time:', b - a, 'ms');
}

const end = Date.now();
console.log('Total time taken:', end - start, 'ms');