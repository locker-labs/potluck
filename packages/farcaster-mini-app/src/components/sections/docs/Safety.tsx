"use client";

import { DropDown } from "@/components/subcomponents/DropDown";

export function Safety() {
  return (
    <DropDown header="Safety & Trust">
      <ul className="list-disc list-inside">
        <li>Funds handled by secure smart contracts (non-custodial)</li>
        <li>Wallet Permissions:</li>
      </ul>
      <ul className="list-disc list-inside ml-6">
        <li>Public Pots: Addresses are public</li>
        <li>Private Pots: Participant list is private</li>
      </ul>
      <ul className="list-disc list-inside mt-2">
        <li>Rules cannot be altered mid-cycle without group consensus</li>
      </ul>
    </DropDown>
  );
}
