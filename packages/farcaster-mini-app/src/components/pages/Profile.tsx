"use client";

// TODO: This component will be used for public profiles when we add reputation
import { type Address, getAddress, isAddress } from "viem";
import type { FUser } from "@/types/neynar";
import { fetchFarcasterUsers } from "@/lib/api/fetchFarcasterUsers";
import { useEffect, useMemo, useState } from "react";
import UserCard from "../subcomponents/UserCard";
import TokenWithdraw from "../subcomponents/TokenWithdraw";
import YourPots from "../sections/YourPots";
import Reputation from "../subcomponents/Reputation";

export type User = {
    fid: number;
    username: string;
    display_name: string;
}
const addressToFUserMap = new Map<string, FUser>();

    function decodeUser(data: Record<string, User>): User | null {
      const entries = Object.entries(data);
      return entries.length > 0 ? entries[0][1] : null;
    }

export default function Profile({ address }: { address: string }) {
  const [fUser, setFUser] = useState<FUser | null>(null);
  const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    
  const normalized = useMemo(() => {
    try {
      return isAddress(address) ? getAddress(address) : null;
    } catch {
      return null;
    }
  }, [address]);
    
  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!normalized) {
        setFUser(null);
        return;
      }
      setLoading(true);
      setErr(null);
      const { data, error } = await fetchFarcasterUsers({
        addresses: [normalized as Address],
      });
      console.log("Farcaster user data:", data);
      if (!mounted) return;
      if (error) {
        setErr(error);
        setFUser(null);
      } else {
          const decodedUser = decodeUser(data);
          const user: FUser = {
              fid: decodedUser?.fid || 0,
              username: decodedUser?.username || "",
              display_name: decodedUser?.display_name || "",
          }
        setFUser(user);
      }
      setLoading(false);
    }
    run();
    return () => {
      mounted = false;
    };
  }, [normalized]);
  if (!address) return null;
  return (
    <div id="pot-page" className="px-4 py-4">
      <h1 className="text-xl font-bold mb-4">Profile</h1>
      <div className="flex flex-col gap-4">
        {loading && <div>Loading Farcaster…</div>}
        {fUser && <UserCard user={fUser} address={normalized as Address} />}
        <TokenWithdraw address={normalized as Address} />
              <YourPots type="created" />
              <Reputation />
        </div>
    </div>
  );
}
