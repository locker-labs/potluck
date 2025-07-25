import { useEffect, useState } from "react";
import { Users as UsersIcon, ChevronDown, ChevronUp } from "lucide-react";
import { getPotRequests } from "@/lib/getLogs";
import { BorderButton, GradientButton3 } from "../ui/Buttons";
import { useAllowPotRequest } from "@/hooks/useAllowPotRequest";
import { Address } from "viem";
import { getAllowedAddresses } from "@/lib/getLogs";

interface JoinRequestsProps {
  potId: bigint;
}

export function JoinRequests({ potId }: JoinRequestsProps) {
  const [requests, setRequests] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { handleAllow, pendingApproval } = useAllowPotRequest();
  useEffect(() => {
    setLoading(pendingApproval !== null);
    if (pendingApproval !== null) return;
    const fetchRequests = async () => {
      try {
        const logs = await getPotRequests(potId);
        const addresses: string[] = logs
          .map((log) => {
            if (
              log.args &&
              typeof log.args === "object" &&
              "requester" in log.args &&
              typeof (log.args as Record<string, unknown>).requester ===
                "string"
            ) {
              return (log.args as Record<string, unknown>).requester as string;
            }
            return "";
          })
          .filter((addr) => addr !== "");
        const allowedAddresses = await getAllowedAddresses(potId);
        const pending = addresses.filter(
          (addr) => !allowedAddresses.includes(addr as Address)
        );
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
    <div className="bg-gray-800 rounded-xl overflow-hidden mt-2.5">
      {/* Header */}
      <GradientButton3
        className="w-full flex justify-between items-center text-left px-4 py-3"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-app-cyan" />
          <span className="font-semibold text-white">Join Requests</span>
        </div>
        <span className="text-sm text-gray-400">
          {requests.length} request{requests.length !== 1 ? "s" : ""}
        </span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </GradientButton3>

      {/* Body */}
      {open && (
        <>
          <div
            className="overflow-y-auto border-t border-gray-700"
            style={{ maxHeight: "12.5rem" }}
          >
            {requests.length > 0 ? (
              requests.map((addr) => (
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
                    <span className="text-sm text-gray-200">
                      {addr.slice(0, 6)}…{addr.slice(-4)}
                    </span>
                  </div>
                </label>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400">
                No pending requests
              </div>
            )}
          </div>

          {/* Footer with batch action */}
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
        </>
      )}
    </div>
  );
}
