import type React from "react";
import type { Address } from "viem";
import type { FUser } from "@/types/neynar";
import { GradientCard2 } from "../ui/GradientCard";
import { formatAddress } from "@/lib/address";

interface UserCardProps {
  user: FUser | null;
  address: string;
}

const UserCard: React.FC<UserCardProps> = ({ user, address }) => {
  return (
    <GradientCard2 className="gap-4">
      <p className="text-xs text-gray-400">User</p>

      {user ? (
        <>
          <div className="font-bold text-xl mb-1">{user.display_name}</div>
          <div className="flex justify-between items-center">
            <div className="text-sm mb-1">@{user.username}</div>
            <div className="font-mono text-sm">
              {formatAddress(address as Address)}
            </div>
          </div>
        </>
      ) : (
        <div className="font-bold text-lg mb-1">
          {formatAddress(address as Address)}
        </div>
      )}
    </GradientCard2>
  );
};

export default UserCard;
