import React, { useEffect, useState } from "react";
import { getTokenBalance } from "@/lib/helpers/contract";
import { tokenAddress as USDC } from "@/config";
import { Address } from "viem";
import { GradientCard } from "../ui/GradientCard";
import { GradientButton } from "../ui/Buttons";

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  address: Address;
}

interface TokenWithdrawProps {
  address: Address;
}

const TokenWithdraw: React.FC<TokenWithdrawProps> = ({ address }) => {
  // Placeholder for fetched tokens
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [amounts, setAmounts] = useState<{ [tokenAddress: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Fetch tokens and balances for the given address here

  const handleChange = (tokenAddress: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [tokenAddress]: value }));
  };

  const handleWithdraw = () => {
    // TODO: Implement withdraw logic
    // Example: send { address, withdrawals: amounts }
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000); // Placeholder
  };
    
    useEffect(() => {
      const fetchTokenBalances = async () => {
        const usdcBalance = await getTokenBalance(address, USDC);
        setTokens([{ symbol: "USDC", balance: usdcBalance.toString(), decimals: 6, address: USDC }]);
      };
      fetchTokenBalances();
    }, [address]);

  return (
      <GradientCard>
        <p className="text-xs text-gray-400">Balances</p>
      <div className="space-y-4">
        {tokens.length === 0 ? (
          <div className="text-md">
            No savings found, start now!.
          </div>
        ) : (
          tokens.map((token) => (
            <div key={token.address} className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">{token.symbol}</span>
                <span className="text-xs text-gray-500">
                  Balance: {token.balance}
                </span>
              </div>
              <input
                type="number"
                min="0"
                step={1 / Math.pow(10, token.decimals)}
                className="border rounded px-2 py-1 text-sm"
                placeholder={`Amount to withdraw (${token.symbol})`}
                value={amounts[token.address] || ""}
                onChange={(e) => handleChange(token.address, e.target.value)}
                disabled={isLoading}
              />
            </div>
          ))
        )}
      </div>
      {tokens.length > 0 && (
        <GradientButton
          className="mt-6 w-full"
          onClick={handleWithdraw}
          disabled={isLoading}
        >
          {isLoading ? "Withdrawing..." : "Withdraw"}
        </GradientButton>
      )}
    </GradientCard>
  );
};

export default TokenWithdraw;
