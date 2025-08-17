"use client";

import { DropDown } from "@/components/subcomponents/DropDown";

export function Deployments() {
  return (
    <DropDown header="Contract & Mini App Details">
      <div className="space-y-3">
        <div>
          <p className="font-medium text-white">Contract Addresses</p>
          <ul className="list-disc list-inside">
            <li>Mainnet: to be added</li>
            <li>Testnet: to be added</li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-white">Required Chains</p>
          <p>[list]</p>
        </div>

        <div>
          <p className="font-medium text-white">Capabilities</p>
          <ul className="list-disc list-inside">
            <li>Wallet connection</li>
            <li>Signing</li>
            <li>Contribution</li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-white">Mini App</p>
          <p>Compatible with Farcaster .well-known/farcaster.json manifest.</p>
        </div>
      </div>
    </DropDown>
  );
}
