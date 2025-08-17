"use client";

import { DropDown } from "@/components/subcomponents/DropDown";

export function HowItWorks() {
  return (
    <DropDown header="How Potluck Works">
      <p>
        Potluck is a blockchain-powered group savings & payout system inspired
        by susus/tandas. Participants contribute a fixed amount at set
        intervals, and one person receives the pooled amount each cycle.
      </p>

      <h4 className="mt-4 mb-2 font-semibold text-white">Pot Types</h4>
      <div className="space-y-3">
        <div>
          <p className="font-medium text-white">Public Pots</p>
          <ul className="list-disc list-inside text-gray-200">
            <li>Visible to all Potluck users</li>
            <li>Open for anyone to join if eligible</li>
            <li>Participant and pot details are publicly viewable</li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-white">Private Pots</p>
          <ul className="list-disc list-inside text-gray-200">
            <li>Invite-only and not listed publicly</li>
            <li>Only members or invited users can see details</li>
            <li>Ideal for friends, family, or private communities</li>
          </ul>
        </div>
      </div>

      <h4 className="mt-4 mb-2 font-semibold text-white">Example</h4>
      <p>
        8 friends each contribute $100 weekly. Each week, one friend receives
        $800 until all have received a payout.
      </p>
    </DropDown>
  );
}
