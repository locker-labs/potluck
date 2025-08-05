import { contractAddress, tokenAddress, tokenDecimals } from "@/config";
import {
	usePlatformFee,
	type UsePlatformFeeReturnType,
} from "@/hooks/usePlatformFee";
import type {
	RefetchOptions,
	QueryObserverResult,
} from "@tanstack/react-query";
import React, { createContext, type ReactNode, useContext } from "react";
import { toast } from "sonner";
import {
	useAccount,
	useBalance,
	useReadContract,
	useWriteContract,
} from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import type { Address, GetBalanceErrorType, ReadContractErrorType } from "viem";

type PotluckContextType = Pick<
	UsePlatformFeeReturnType,
	| "platformFeeWei"
	| "participantFeeWei"
	| "platformFeeEth"
	| "participantFeeEth"
	| "calculateCreatorFee"
	| "calculateJoineeFee"
> & {
	address: Address | undefined;
	dataNativeBalance:
		| {
				decimals: number;
				symbol: string;
				value: bigint;
				valueParsed: string;
				valueFormatted: string;
				valueFormattedSym: string;
		  }
		| undefined;
	tokenBalance: bigint | undefined;
	tokenAllowance: bigint | undefined;
	isLoading: boolean;
	isLoadingFee: boolean;
	isLoadingNativeBalance: boolean;
	isLoadingTokenAllowance: boolean;
	isLoadingTokenBalance: boolean;
	isPendingApproveTokens: boolean;
	approveTokens: (amount: bigint) => Promise<void>;
	refetch: () => Promise<void>;
	refetchFee: () => Promise<void>;
	refetchNativeBalance: (options?: RefetchOptions) => Promise<
		QueryObserverResult<
			{
				decimals: number;
				formatted: string;
				symbol: string;
				value: bigint;
			},
			GetBalanceErrorType
		>
	>;
	refetchTokenAllowance: (
		options?: RefetchOptions,
	) => Promise<QueryObserverResult<bigint, ReadContractErrorType>>;
	refetchTokenBalance: (
		options?: RefetchOptions,
	) => Promise<QueryObserverResult<bigint, ReadContractErrorType>>;
};

const PotluckContext = createContext<PotluckContextType | null>(null);

// PotluckProvider component to provide platform fee data to the application
export const PotluckProvider = ({ children }: { children: ReactNode }) => {
	const { address } = useAccount();
	const {
		data: nativeBalanceData,
		isLoading: isLoadingNativeBalance,
		refetch: refetchNativeBalance,
	} = useBalance({ address, query: { enabled: !!address, refetchInterval: 5000 } });
	const dataNativeBalance = nativeBalanceData ? (() => {
		const parsedValue = formatUnits(nativeBalanceData.value, nativeBalanceData.decimals);
		const parts = parsedValue.split('.');
		const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts[1].slice(0, 4) : '');
		return	{
			decimals: nativeBalanceData.decimals,
			symbol: nativeBalanceData.symbol,
			value: nativeBalanceData.value,
			valueParsed: parsedValue,
			valueFormatted: formattedValue,
			valueFormattedSym: `${formattedValue} ${nativeBalanceData.symbol}`,
		}
	})() : undefined;
	const {
		data: tokenBalance,
		isLoading: isLoadingTokenBalance,
		refetch: refetchTokenBalance,
	} = useReadContract({
		abi: erc20Abi,
		address: tokenAddress,
		functionName: "balanceOf",
		args: [address as Address],
		query: { enabled: !!address, refetchInterval: 5000 },
	});
	const {
		data: tokenAllowance,
		isLoading: isLoadingTokenAllowance,
		refetch: refetchTokenAllowance,
	} = useReadContract({
		address: tokenAddress,
		abi: erc20Abi,
		functionName: "allowance",
		args: [address as Address, contractAddress],
		query: { enabled: !!address, refetchInterval: 5000 },
	});
	const {
		platformFeeWei,
		participantFeeWei,
		platformFeeEth,
		participantFeeEth,
		isLoading: isLoadingFee,
		refetch: refetchFee,
		calculateCreatorFee,
		calculateJoineeFee,
	} = usePlatformFee();

	const { writeContractAsync, isPending: isPendingApproveTokens } =
		useWriteContract();

	const approveTokens = async (amount: bigint) => {
		if (!address) {
			throw new Error("Wallet not connected");
		}

		try {
			toast.info("Approve USDC for all rounds");
			await writeContractAsync({
				address: tokenAddress,
				abi: erc20Abi,
				functionName: "approve",
				args: [contractAddress, amount],
			});
			console.log(
				`✅ Approved ${formatUnits(amount, tokenDecimals)} USDC successfully`,
			);
		} catch (error) {
			console.error("❌ Token approval failed:", error);
			throw error;
		} finally {
			setTimeout(() => {
				refetchTokenAllowance();
				toast.dismiss();
			}, 1000);
		}
	};

	const isLoading =
		isLoadingFee ||
		isLoadingNativeBalance ||
		isLoadingTokenBalance ||
		isLoadingTokenAllowance;

	const refetch = async () => {
		await refetchFee();
		await refetchNativeBalance();
		await refetchTokenBalance();
		await refetchTokenAllowance();
	};

	return (
		<PotluckContext.Provider
			value={{
				address,
				isLoading,
				platformFeeWei,
				participantFeeWei,
				platformFeeEth,
				participantFeeEth,
				calculateCreatorFee,
				calculateJoineeFee,
				isLoadingFee,
				refetchFee,
				dataNativeBalance,
				isLoadingNativeBalance,
				refetchNativeBalance,
				tokenBalance,
				isLoadingTokenBalance,
				refetchTokenBalance,
				tokenAllowance,
				isLoadingTokenAllowance,
				refetchTokenAllowance,
				approveTokens,
				isPendingApproveTokens,
				refetch,
			}}
		>
			{children}
		</PotluckContext.Provider>
	);
};

// Custom hook to use Potluck context
export const usePotluck = () => {
	const context = useContext(PotluckContext);
	if (!context) {
		throw new Error("usePotluck must be used within a PotluckProvider");
	}
	return context;
};
