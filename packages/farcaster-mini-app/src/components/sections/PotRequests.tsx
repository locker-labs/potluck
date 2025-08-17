import { useEffect, useState } from "react";
import { Users as UsersIcon, ChevronDown, ChevronUp } from "lucide-react";
import { BorderButton, GradientButton3 } from "../ui/Buttons";
import { useAllowPotRequest } from "@/hooks/useAllowPotRequest";
import type { Address } from "viem";
import { getPotAllowedUsers, getPotPendingRequests } from "@/lib/graphQueries";
import type { FUser } from "@/types/neynar";
import { formatAddress } from "@/lib/address";
import { DropDown } from "../subcomponents/DropDown";

interface JoinRequestsProps {
  potId: bigint;
  users: Record<Address, FUser | null>;
  fetchUsers: (addresses: Address[]) => void;
}

export function JoinRequests({ potId, users, fetchUsers }: JoinRequestsProps) {
  const [requests, setRequests] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { handleAllow, pendingApproval } = useAllowPotRequest();

  // biome-ignore lint/correctness/useExhaustiveDependencies: only potId, pendingApproval are requried
  useEffect(() => {
    setLoading(pendingApproval !== null);
    if (pendingApproval !== null) return;
    const fetchRequests = async () => {
      try {
        const addresses = await getPotPendingRequests(potId);
        const allowedAddresses = await getPotAllowedUsers(potId);
        const pending = addresses.filter(
          (addr) => !allowedAddresses.includes(addr as Address)
        ) as Address[];

        // fetch farcaster names for newAddresses from addresses
        const newAddrs = pending.filter((addr) => !users[addr]);

        if (newAddrs.length > 0) {
          fetchUsers(newAddrs);
        }
        setRequests(pending);
      } catch (error) {
        console.error("Failed to fetch pot requests:", error);
      }
    };
    fetchRequests();
  }, [potId, pendingApproval]);

  const toggleSelect = (addr: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(addr) ? next.delete(addr) : next.add(addr);
      return next;
    });
  };

  const handleBatchApprove = async () => {
    await handleAllow(potId, Array.from(selected) as Address[]);
    setSelected(new Set());
  };

  return (
    <DropDown
      header={
        <>
          <UsersIcon className="w-5 h-5 text-app-cyan" />
          <span className="font-semibold text-white">Join Requests</span>
          <span className="ml-auto text-sm text-gray-400">
            {requests.length} request{requests.length !== 1 ? "s" : ""}
          </span>
        </>
      }
    >
      <div className="overflow-y-auto" style={{ maxHeight: "12.5rem" }}>
        {requests.length > 0 ? (
          requests.map((address) => {
            const addr = address.toLowerCase() as Address;
            const nameOrAddress = users[addr]?.username ?? formatAddress(addr);

            return (
              <label
                key={addr}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(addr)}
                    onChange={() => toggleSelect(addr)}
                    className="h-4 w-4 text-app-cyan bg-gray-600 border-gray-500 rounded focus:ring-app-cyan"
                  />
                  <span className="text-sm text-gray-200">{nameOrAddress}</span>
                </div>
              </label>
            );
          })
        ) : (
          <div className="px-4 py-3 text-sm text-gray-400">
            No pending requests
          </div>
        )}
      </div>

      {requests.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-700 bg-gray-900">
          <BorderButton
            className="w-full"
            onClick={handleBatchApprove}
            disabled={selected.size === 0}
          >
            {loading ? "Loading..." : `Approve Selected (${selected.size})`}
          </BorderButton>
        </div>
      )}
    </DropDown>
  );
}

