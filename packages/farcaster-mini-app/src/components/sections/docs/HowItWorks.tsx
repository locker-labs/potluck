"use client";

import { DropDown } from "@/components/subcomponents/DropDown";

export function HowItWorks() {
  return (
    <DropDown header="How Potluck Works">
      {/* Quick summary */}
      <p className="text-gray-200">
        🤝 Chip into a pot with your friends every week or month. 🔁 Every round,
        one winner gets the whole pot. ✅ By the end, everyone has been paid once.
      </p>

      {/* Key options */}
      <ul className="mt-4 list-disc list-inside space-y-2 text-gray-200">
        <li>🔒 <strong>Private pots</strong> let you control who you save with</li>
        <li>🌐 <strong>Public pots</strong> can be risky but rewarding</li>
      </ul>

      {/* Example (separate section) */}
      <h4 className="mt-6 mb-2 font-semibold text-white">Example</h4>
      <p className="text-gray-200">
        🧮 8 people × $100 weekly → one person gets $800 each week, rotating until
        all 8 receive a payout.
      </p>

      {/* Original detailed text (edited for context) */}
      <h4 className="mt-8 mb-2 font-semibold text-white">More Detail</h4>
      <p className="text-gray-200">
        Potluck is a rotating savings and payout system, inspired by{" "}
        <a
          href="https://en.wikipedia.org/wiki/Susu_(informal_loan_club)"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white"
        >
          susus
        </a>{" "}
        /
        {" "}
        <a
          href="https://en.wikipedia.org/wiki/Tanda_(informal_loan_club)"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white"
        >
          tandas
        </a>
        . Participants contribute a fixed amount on a schedule, and each cycle one
        participant receives the pooled funds. Over the full rotation, everyone is
        paid exactly once.
      </p>

      <div className="space-y-3">
        <div>
          <p className="font-medium text-white mt-4">Public Pots</p>
          <ul className="list-disc list-inside text-gray-200">
            <li>Discoverable by all Potluck users</li>
            <li>Open to eligible joiners</li>
            <li>Members and pot details are viewable</li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-white">Private Pots</p>
          <ul className="list-disc list-inside text-gray-200">
            <li>Invite-only and not listed publicly</li>
            <li>Details visible only to members and invitees</li>
            <li>Best for friends, family, or closed communities</li>
          </ul>
        </div>
      </div>
    </DropDown>
  );
}
