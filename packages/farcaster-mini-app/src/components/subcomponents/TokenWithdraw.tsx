import type React from "react";
import { useMemo, useState } from "react";
import { tokenAddress as USDC } from "@/config";
import { formatUnits, parseUnits, type Address } from "viem";
import { GradientCard } from "../ui/GradientCard";
import { GradientButton } from "../ui/Buttons";
import { SectionHeading } from "../ui/SectionHeading";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { usePotluck } from "@/providers/PotluckProvider";
import { Loader2 } from "lucide-react";
import { useWithdraw } from "@/hooks/useWithdraw";

export interface TokenBalance {
	symbol: string;
	// balance: bigint;
	decimals: number;
	address: Address;
}

interface TokenWithdrawProps {
	address: Address;
	isMyAddress: boolean;
}

const tokenWithdrawSchema = ({
	tokenBalance,
}: {
	tokenBalance: bigint | undefined;
}) => {
	return z.object({
		amount: z
			.string()
			.refine(
				(val) =>
					val !== "" && !Number.isNaN(Number(val)) && Number(val) >= 0.01,
				{
					message: "must be at least 0.01",
				},
			)
			.refine(
				(val) => {
					// Accept only up to two decimal places
					if (val === "") return true;
					const decimals = val.split(".");
					if (decimals.length < 2) return true;
					return decimals[1].length <= 2;
				},
				{
					message: "Only 2 decimal places allowed",
				},
			)
			.refine(
				(val) => {
					if (val === "") return true;
					const amountBigInt = BigInt(parseUnits(val, 6));
					const isInsufficientTokenBalance =
						tokenBalance !== undefined && amountBigInt > tokenBalance;
					console.log({ isInsufficientTokenBalance });
					return !Number.isNaN(Number(val)) && !isInsufficientTokenBalance;
				},
				{
					message: "exceeds your balance",
				},
			),
	});
};

const TokenWithdraw: React.FC<TokenWithdrawProps> = ({ address, isMyAddress }) => {
	const [tokens, setTokens] = useState<TokenBalance[]>([
		{
			symbol: "USDC",
			decimals: 6,
			address: USDC,
		},
	]);
	const [token, setToken] = useState<TokenBalance | undefined>({
		symbol: "USDC",
		decimals: 6,
		address: USDC,
	});
	const [amount, setAmount] = useState("");
	// Form Action State
	const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
	const [errors, setErrors] = useState<{ [k: string]: string }>({});
	const [clickedSubmit, setClickedSubmit] = useState(false);

	const { dataNativeBalance, isLoading: isLoadingPotluck } = usePotluck();
    const { isLoading: isLoadingWithdraw, isWithdrawing, handleWithdraw, withdrawBalance } = useWithdraw();

	const validationSchema = useMemo(
		() =>
			tokenWithdrawSchema({
				tokenBalance: withdrawBalance ?? BigInt(0),
			}),
		[withdrawBalance],
	);

	// FUNCTIONS
	// Accepts overrides for latest values
	// Only for input validation
	const validate = (
		override?: Partial<{
			amount: string;
		}>,
	) => {
		const values = {
			amount,
			...override,
		};
		const result = validationSchema.safeParse(values);
		if (!result.success) {
			const fieldErrors: { [k: string]: string } = {};
			for (const err of result.error.errors) {
				if (err.path[0]) fieldErrors[err.path[0]] = err.message;
			}
			setErrors(fieldErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	const hasTouched = Object.keys(touched).length > 0;
	const hasErrors = Object.keys(errors).length > 0;
	const showError = (key: string) =>
		(clickedSubmit || touched[key]) && errors[key];


    /**
	 * @dev do not add isWithdrawing in isLoading but keep it in disabled
	 * this is to display 'Withdraw' text with loader when isWithdrawing is true
	 */
    const isLoading = isLoadingWithdraw || isLoadingPotluck;

	const disabled =
		isLoading || isWithdrawing || ((clickedSubmit || hasTouched) && hasErrors);

	const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		setClickedSubmit(true);
		if (!validate()) return;
		if (!disabled && token) {
			handleWithdraw(token.address, BigInt(parseUnits(amount, token.decimals)));
		}
	};
	// TODO: take into account gas fee for dataNativeBalance

	const hasBalance = withdrawBalance !== undefined && withdrawBalance > BigInt(0);
	const hasNoBalance = withdrawBalance !== undefined && withdrawBalance === BigInt(0);
	const showWithdraw = isMyAddress && token && hasBalance;
	const showStartSaving = isMyAddress && token && hasNoBalance;

	return (
		<div>
			<SectionHeading>Savings</SectionHeading>
			<GradientCard>
				<div className="space-y-4">
					{!showStartSaving ? (
						<div>
							<p className="text-md">No savings found, start now!</p>
						</div>
					) : (
						tokens.map((token) => (
							<div
								key={token.address}
								className="w-full flex items-center justify-between"
							>
								<div>
									{/* w-full flex items-center justify-between gap-4 */}
									<p className="text-base font-bold text-gray-300">Balance</p>
									<p className="pb-1 text-3xl font-bold">
										{Number(formatUnits(withdrawBalance ?? BigInt(0), token.decimals))}{" "}
										{token.symbol}
									</p>
								</div>
							</div>
						))
					)}
				</div>

                {/* Withdraw Amount Input */}
				{showWithdraw ? (
					<div className="mt-2 flex flex-col gap-1">
						<div>
							<label htmlFor="enrty-amount" className="block mb-2.5">
								<span className="text-base font-bold text-gray-300">
									Amount{" "}
								</span>
								<span
									className={`font-medium text-xs text-red-500 ${showError("amount") ? "visible" : "hidden"}`}
								>{`${errors.amount}`}</span>
							</label>
							<Input
								className={`rounded-xl w-full ${showError("amount") ? "outline-red-500 ring ring-red-500" : null}`}
								id="enrty-amount"
								type="number"
								value={amount}
								onChange={(e) => {
									// Prevent negative values
									const value = e.target.value;
									// Only allow up to two decimal places
									if (
										value === "" ||
										(/^\d*(\.\d{0,2})?$/.test(value) &&
											Number.parseFloat(value) >= 0)
									) {
										setTouched((prev) => ({ ...prev, amount: true }));
										setAmount(value);
										validate({ amount: value });
									}
								}}
								onKeyDown={(e) => {
									// Prevent typing minus sign
									if (e.key === "-" || e.key === "e") {
										e.preventDefault();
									}
								}}
								placeholder={formatUnits(withdrawBalance ?? BigInt(0), token.decimals) ?? "0"}
							/>
						</div>
					</div>
				) : null}

                {/* Withdraw Button */}
				{showWithdraw ? (
					<GradientButton
						className="mt-4 w-full"
						onClick={onClick}
						disabled={disabled}
					>
						<span className={"flex items-center justify-center gap-2"}>
							<span>{isLoading ? "Loading" : "Withdraw"}</span>
							{isLoading || isWithdrawing ? (
								<Loader2
									className="animate-spin h-5 w-5 text-white"
									size={20}
								/>
							) : null}
						</span>
					</GradientButton>
				) : null}
			</GradientCard>
		</div>
	);
};

export default TokenWithdraw;
