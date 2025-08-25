"use client";

import { DropDown } from "@/components/subcomponents/DropDown";

export function CreateJoinRotate() {
  return (
    <DropDown
      header="Potluck Actions"
      contentClassName="flex flex-col gap-2 p-2"
      innerClassName=""
      defaultOpen
    >
      {/* Nested: Create a Pot */}
      <div className="p-0">
        <DropDown header="Create a Pot">
          <p className="mb-2">
            Choose a Public or Private pot and configure the rules:
          </p>

          <ul className="list-disc list-inside">
            <li>Contribution Amount</li>
            <li>Cycle Duration (e.g., weekly, monthly)</li>
            <li>Number of Participants</li>
            <li>Chain Selection</li>
          </ul>

          <p className="mt-2">
            Public pots are listed for everyone to see and join; private pots
            require invite by wallet address or secure link and aren’t publicly
            visible.
          </p>
          <p className="mt-2">
            Creating a pot deploys a custom on-chain smart contract.
          </p>
        </DropDown>
      </div>

      {/* Nested: Join a Pot */}
      <div className="mt-4 p-0">
        <DropDown header="Join a Pot">
          <p className="mb-2 font-medium text-white">Public Pots</p>
          <ul className="list-disc list-inside mb-3">
            <li>Browse available pots</li>
            <li>Review details and join if slots remain</li>
            <li>Confirm in your wallet</li>
          </ul>

          <p className="mb-2 font-medium text-white">Private Pots</p>
          <ul className="list-disc list-inside mb-3">
            <li>Receive an invite link or be added by an admin</li>
            <li>Accept invite and confirm on-chain</li>
          </ul>

          <p className="mb-2 font-medium text-white">Requirements</p>
          <ul className="list-disc list-inside">
            <li>Supported wallet</li>
          </ul>
        </DropDown>
      </div>

      {/* Nested: Automated Actions (Rotation, Winner/Payouts, Reminders) */}
      <div className="mt-4 p-0">
        <DropDown header="Automated Actions (Rotation & Payouts)">
          <h4 className="mb-2 font-semibold text-white">Rotation & Payouts</h4>
          <ul className="list-disc list-inside">
            <li>Standard Rotation: Pre-set order until all have received payouts</li>
            <li>Randomized (optional for Public Pots): Order may change each cycle</li>
            <li>Private Pots: Admin chooses rotation type</li>
          </ul>

          <p className="mt-3">
            Example: 8 friends each contribute $100 weekly; one receives $800
            per week until all have received a payout once.
          </p>

          <h4 className="mt-4 mb-2 font-semibold text-white">Reminders</h4>
          <ul className="list-disc list-inside">
            <li>Public Pots: Automated payment reminders sent</li>
            <li>Private Pots: Admin can manually remind</li>
          </ul>
        </DropDown>
      </div>

      {/* Tips */}
      <div className="mt-4 p-0">
        <DropDown header="Tips">
          <ul className="list-disc list-inside">
            <li>Public: Great for community saving and meeting new people</li>
            <li>Private: Best for trusted groups with invite control</li>
          </ul>
        </DropDown>
      </div>
    </DropDown>
  );
}
