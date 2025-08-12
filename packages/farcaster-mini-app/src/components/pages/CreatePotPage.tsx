'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatEther, parseUnits } from 'viem';
import { MoveLeft, Loader2, Info } from 'lucide-react';
import { GradientButton, GradientButton3 } from '../ui/Buttons';
import { useCreatePot } from '@/hooks/useCreatePot';
import { formatUnits } from 'viem';
import { z } from 'zod';
import { MAX_PARTICIPANTS } from '@/config';
import { AnimatePresence, motion } from 'motion/react';
import { initialDown, transition, animate } from "@/lib/pageTransition";
import { CreatePotSuccessDialog } from '@/components/subcomponents/CreatePotSuccessDialog';
import { daySeconds, weekSeconds, monthSeconds } from '@/lib/helpers/contract';
import { usePotluck } from '@/providers/PotluckProvider';
import { truncateDecimals } from '@/lib/helpers/math';

const emojis = ["🎯", "🏆", "🔥", "🚀", "💪", "⚡", "🎬", "🎓", "🍕", "☕"];

const timePeriods = [
  { value: BigInt(daySeconds), label: "Daily" },
  { value: BigInt(weekSeconds), label: "Weekly" },
  { value: BigInt(monthSeconds), label: "Monthly" },
];

const modes = [
  // value is for isPublic boolean
  { value: true, label: "Public" },
  { value: false, label: "Private" },
];

// Zod schema for form validation
const createPotSchema = ({
  tokenBalance,
  // dataNativeBalance,
  // calculateCreatorFee
}: {
  tokenBalance: bigint | undefined;
  // dataNativeBalance: { value: bigint } | undefined;
  // calculateCreatorFee: (maxParticipants: number) => undefined | {
  //   value: bigint;
  //   formatted: string;
  // }
}) => {
  return z.object({
  name: z.string().min(1, "is required"),
  amount: z
    .string()
    .refine(
      (val) => val !== "" && !Number.isNaN(Number(val)) && Number(val) >= 0.01,
      {
        message: "must be at least 0.01",
      }
    )
    .refine(
      (val) => {
        // Accept only up to two decimal places
        if (val === "") return true;
        const decimals = val.split('.');
        if (decimals.length < 2) return true;
        return decimals[1].length <= 2;
      },
      {
        message: "Only 2 decimal places allowed",
      }
    )
    .refine(
      (val) => {
        if (val === "") return true;
        const amountBigInt = BigInt(parseUnits(val, 6));
        const isInsufficientTokenBalance = tokenBalance !== undefined && amountBigInt > tokenBalance;
        console.log({ isInsufficientTokenBalance })
        return !Number.isNaN(Number(val)) && !isInsufficientTokenBalance},
      {
        message: "exceeds your balance",
      }
    ),
  maxParticipants: z
    .string()
    .refine((val) => !Number.isNaN(Number(val)), {
      message: "must be a number",
    })
    .refine(
      (val) => Number(val) <= MAX_PARTICIPANTS,
      {
        message: `should not exceed ${MAX_PARTICIPANTS}`,
      }
    )
    .refine((val) => Number(val) !== 1, {
      message: "should be more than 1",
    }),
    // .refine(
    //   (val) => {
    //     const maxParticipantsInt = Number.parseInt(val || "0", 10);
    //     const validMaxParticipants = maxParticipantsInt !== 1 && maxParticipantsInt <= MAX_PARTICIPANTS;
    //     const totalFee = validMaxParticipants ? calculateCreatorFee(maxParticipantsInt) : undefined;
    //     const isInsufficientNativeBalance = dataNativeBalance !== undefined && totalFee !== undefined && totalFee.value > dataNativeBalance.value;
    //     return !isInsufficientNativeBalance;
    //   },
    //   {
    //     message: "Insufficient Balance",
    //   }
    // ),
  emoji: z.string().min(1, "is required"),
  timePeriod: z.bigint(),
});
}

export default function CreatePotPage() {
  // Form Input State
  const [emoji, setEmoji] = useState<string>(emojis[0]);
  const [name, setName] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<bigint>(timePeriods[0].value);
  const [amount, setAmount] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  // Form Action State
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [clickedSubmit, setClickedSubmit] = useState(false);

  const potName = `${emoji} ${name.trim()}`;
  const amountBigInt = BigInt(parseUnits(amount, 6));
  const maxParticipantsInt = Number.parseInt(maxParticipants || '0', 10);

  const router = useRouter();
  const {
    potId,
    handleCreatePot,
    isCreatingPot,
    isLoading,
    hash,
  } = useCreatePot();
  const {
			calculateCreatorFee,
			tokenBalance,
			dataNativeBalance,
      refetch,
		} = usePotluck();
  
  const validationSchema = useMemo(
			() =>
				createPotSchema({
					tokenBalance,
					// dataNativeBalance,
          // calculateCreatorFee
        }),
			[
        tokenBalance,
        // dataNativeBalance,
        // calculateCreatorFee
      ],
		);

  // FUNCTIONS
  // Accepts overrides for latest values
  // Only for input validation
  const validate = (
    override?: Partial<{
      name: string;
      amount: string;
      maxParticipants: string;
      emoji: string;
      timePeriod: bigint;
    }>
  ) => {
    const values = {
      name,
      amount,
      maxParticipants,
      emoji,
      timePeriod,
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setClickedSubmit(true);
    if (!validate()) return;
    await handleCreatePot(
      potName,
      amountBigInt,
      maxParticipantsInt,
      timePeriod,
      isPublic
    );
  };

  // These are only for rendering
  const amountTokenFormatted: string = formatUnits(amountBigInt, 6);
  const validMaxParticipants = maxParticipantsInt !== 1 && maxParticipantsInt <= MAX_PARTICIPANTS;
  // const totalGasFee = validMaxParticipants ? calculateJoineeFee(maxParticipantsInt) : undefined;
  const totalFee = validMaxParticipants ? calculateCreatorFee(maxParticipantsInt) : undefined;
  const isInsufficientNativeBalance = dataNativeBalance !== undefined && totalFee !== undefined && totalFee.value > dataNativeBalance.value;

  const hasErrors = Object.keys(errors).length > 0;
  const hasTouched = Object.keys(touched).length > 0;
  const showError = (key: string) => (clickedSubmit || touched[key]) && errors[key];
  const showInsufficientNativeBalance = (clickedSubmit || touched.maxParticipants) && isInsufficientNativeBalance;

  const disabled = isLoading || isCreatingPot || (clickedSubmit && hasErrors) || showInsufficientNativeBalance;

  return (
      <motion.div
          className={'pt-2 px-4'}
          initial={initialDown}
          animate={animate}
          transition={transition}
      >
      <div>
        <div className="w-full flex items-center justify-start gap-4 mb-6">
          <GradientButton3 onClick={() => router.push("/")} className="text-sm">
            <MoveLeft size={20} />
          </GradientButton3>
          <div className="w-full">
            <p className="text-2xl font-bold">Create Pot</p>
            <p className="text-sm font-light">
              Set up your community pot in minutes
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>

          {/* Name */}
          <div>
            <label
              htmlFor="pot-name"
              className="block"
            >
              <span className='text-base font-bold'>Goal {" "}</span>
              <span
                className={`text-xs text-red-500 font-medium ${showError('name') ? "visible" : "hidden"}`}
              >{`${errors.name}`}</span>
            </label>
            <Input
              id="pot-name"
              name="pot-name"
              type="text"
              value={name}
              onChange={(e) => {
                setTouched((prev) => ({ ...prev, name: true }));
                setName(e.target.value);
                validate({ name: e.target.value });
              }}
              placeholder="DeFi Warriors"
              className={`mt-2 w-full ${
                showError('name')
                  ? "outline-red-500 ring ring-red-500"
                  : null
              }`}
            />
          </div>

          {/* Choose Emoji */}
          <div>
            <label
              htmlFor="choose-emoji"
              className="block text-base font-bold"
            >
              Icon
            </label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {emojis.map((emojiOption) => (
                <button
                  key={emojiOption}
                  type="button"
                  className={`h-[50px] p-2 inline-flex items-center justify-center text-2xl rounded-2xl transition-all ease-out duration-350 ${
                    emoji === emojiOption
                      ? "bg-app-cyan/20 border border-app-cyan outline outline-1 outline-app-cyan text-[33px]"
                      : "bg-app-dark border border-app-light"
                  }`}
                  onClick={() => setEmoji(emojiOption)}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </div>

          {/* Choose Time Period */}
          <div>
            <label
              htmlFor="time-period"
              className="block text-base font-bold mb-2.5"
            >
              Frequency
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {timePeriods.map((period) => (
                <button
                  key={period.value}
                  type="button"
                  className={`w-full p-2 flex items-center justify-center text-base font-bold rounded-lg transition-colors outline ${
                    period.value === timePeriod
                      ? "bg-app-cyan/20 outline-2 outline-app-cyan"
                      : "bg-app-dark outline-1 outline-app-light"
                  }`}
                  onClick={() => setTimePeriod(period.value)}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Amount */}
          <div>
            <label
              htmlFor="enrty-amount"
              className="block mb-2.5"
            >
              <span className='text-base font-bold'>Amount{" "}</span>
              <span
                className={`font-medium text-xs text-red-500 ${showError('amount') ? "visible" : "hidden"}`}
              >{`${errors.amount}`}</span>
            </label>
            <div className="relative">
              <Input
                className={`w-full pr-16 ${showError('amount') ? "outline-red-500 ring ring-red-500" : null}`}
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
                placeholder="20"
              />
                <motion.button
                  initial={{ scale: 1, translateY: '-50%' }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  className={`absolute right-2 top-1/2 text-white px-3 py-1 rounded-md text-sm font-bold
                    ${tokenBalance !== undefined && amount === truncateDecimals(formatUnits(tokenBalance, 6), 2) ? "bg-app-cyan/20 outline-app-cyan" : "bg-app-light/20 outline-app-light"}
                    outline outline-2
                    `}
                  disabled={tokenBalance === undefined}
                  onClick={() => {
                    if (tokenBalance !== undefined) {
                    const fullBalance = truncateDecimals(formatUnits(tokenBalance, 6), 2);
                    setAmount(fullBalance);
                    validate({ amount: fullBalance });
                    }
                  }}
                >
                  Max
                </motion.button>
            </div>
            {/* Display token balance */}
            {tokenBalance !== undefined && <div className="mt-2 flex items-center text-xs">
              Balance:&nbsp;
                <span className="font-semibold">
                  {truncateDecimals(formatUnits(tokenBalance, 6), 2)} USDC
                </span>
            </div>}
          </div>

          {/* Participation Type */}
          <div>
            <label
              htmlFor="participation-type"
              className="block text-base font-bold"
            >
              Join Mode
            </label>
            <AnimatePresence mode="popLayout">
              {isPublic ? (
                <motion.p
                  key={"participation-public"}
                  className="text-xs text-gray-500"
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 40, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    duration: 0.1,
                  }}
                >
                  Anyone can join
                </motion.p>
              ) : (
                <motion.p
                  key={"participation-private"}
                  className="text-xs text-gray-500"
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    duration: 0.1,
                  }}
                >
                  Only approved participants can join
                </motion.p>
              )}
            </AnimatePresence>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {modes.map((mode) => (
                <button
                  key={`${mode.label}-${mode.value}`}
                  type="button"
                  className={`w-full p-2 flex items-center justify-center text-base font-bold rounded-lg transition-colors outline ${
                    mode.value === isPublic
                      ? "bg-app-cyan/20 outline-2 outline-app-cyan"
                      : "bg-app-dark outline-1 outline-app-light"
                  }`}
                  onClick={() => setIsPublic(mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>


          {/* Commented out for previewing buttons */}
          {/* Participation Type */}
          {/* <div className='mt-5'>
            <div className="flex items-center justify-between">
              <p className="block text-base font-bold">Participation</p>
              <div className="flex items-center gap-4">
                <span
                  className={`w-[40px] text-right leading-none transition-all duration-250 ${
                    isPublic
                      ? "text-white font-medium text-sm"
                      : "text-gray-400 font-normal text-xs pr-[0.75px]"
                  }`}
                >
                  Public
                </span>

                <label className="relative inline-block w-14 h-7 cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                  />
                  <span className="absolute inset-0 bg-gray-700 rounded-full peer-checked:bg-app-cyan transition-colors" />
                  <span className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-all peer-checked:left-8" />
                </label>

                <span
                  className={`w-[44px] leading-none transition-all duration-250 ${
                    !isPublic
                      ? "text-white font-medium text-sm"
                      : "text-gray-400 font-normal text-xs"
                  }`}
                >
                  Private
                </span>
              </div>
            </div>
          </div> */}



          {/* Max Participants */}
          <div>
            <label
              htmlFor="max-participants"
              className="block"
            >
              <span className='text-base font-bold'>Max Members {" "}</span>
              {/* Max participants validation error */}
              <span
                className={`text-xs font-medium text-red-500 mt-1 ${showError('maxParticipants') ? "visible" : "hidden"}`}
              >{errors.maxParticipants}</span>
            </label>
            <p className="font-medium text-xs text-gray-500">Total rounds will be same as number of members</p>
            <Input
              id="max-participants"
              type="number"
              min="1"
              step="1"
              value={maxParticipants}
              onChange={(e) => {
                // Only allow whole numbers >= 1
                const value = e.target.value;
                if (
                  value === "" ||
                  (/^\d+$/.test(value) && Number.parseInt(value, 10) >= 1)
                ) {
                  setTouched((prev) => ({ ...prev, maxParticipants: true }));
                  setMaxParticipants(value);
                  validate({ maxParticipants: value });
                }
              }}
              onKeyDown={(e) => {
                // Prevent typing minus sign, decimal, or e
                if (e.key === "-" || e.key === "." || e.key === "e") {
                  e.preventDefault();
                }
              }}
              placeholder="Default is 255"
              className={`mt-2 w-full ${showError('maxParticipants') || showInsufficientNativeBalance ? "outline-red-500 ring ring-red-500" : null}`}
            />
          </div>
          
          {/* Payment Summary */}
          <div className="border border-gray-700 rounded-[12px] px-3 pt-4">
            <div>
              <p className="block text-base font-bold mb-2">
                Payment Summary
              </p>

              <div className="mb-2 mt-5 w-full flex items-start justify-between">
                <p className="text-sm font-normal">Join Amount:</p>
                <p className="text-sm font-normal">{amountTokenFormatted} USDC</p>
              </div>

              {/* <div className="mb-2 w-full flex items-start justify-between">
                <p className="text-sm font-normal">Platform Fee:</p>
                <p className="text-sm font-normal">{platformFeeEth ? `${platformFeeEth} ETH` : '-'}</p>
              </div>

              <div className="mb-2 w-full flex items-start justify-between">
                <p className="text-sm font-normal">Total Gas Fee{roundsForFee ? ` (${roundsForFee} rounds)` : null}:</p>
                <p className="text-sm font-normal">{totalGasFee ? `${totalGasFee.formatted} ETH` : '-'}</p>
              </div> */}

              <div className="mb-2 w-full flex items-start justify-between">
                <p className="text-sm font-normal">Platform Fee{validMaxParticipants ? ` (${maxParticipantsInt || MAX_PARTICIPANTS} Rounds)` : null}:</p>
                <p className="text-sm font-normal">{totalFee ? `${totalFee.formatted} ETH` : '-'}</p>
              </div>

              {showInsufficientNativeBalance && <div className="mb-2 w-full flex items-start justify-between">
                <p className="text-sm font-medium text-red-500">Insufficient Balance:</p>
                <p className="text-sm font-medium text-red-500">
                  {truncateDecimals(formatEther(dataNativeBalance.value), 4)} ETH
                </p>
              </div>}

              <hr />

              <div className="mt-2 mb-3 w-full flex items-start justify-between">
                <p className="text-sm font-bold">Total:</p>
                <p className="text-sm font-bold">{amountTokenFormatted} USDC</p>
              </div>

              <div className="mt-2 mb-3 p-2 w-full flex gap-1.5 items-start justify-between border border-[#FFB300] rounded-[8px] bg-[#45412E]">
                <Info className="text-[#FFB300]" size={18} strokeWidth={1.25} />
                <p className="w-full text-left text-xs font-normal text-[#FFB300]">
                  You will be asked to approve tokens for all rounds and to confirm a wallet transaction.
                </p>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <GradientButton type="submit" className="w-full" disabled={disabled}>
            <span className={"flex items-center justify-center gap-2"}>
              <span>{isLoading ? "Loading" : "Create"}</span>
              {isLoading || isCreatingPot ? (
                <Loader2
                  className="animate-spin h-5 w-5 text-white"
                  size={20}
                />
              ) : null}
            </span>
          </GradientButton>
        </form>
      </div>

      {/* Success Dialog */}
      <CreatePotSuccessDialog
        hash={hash}
        potId={potId}
        amountBigInt={amountBigInt}
        timePeriod={timePeriod}
      />
    </motion.div>
  );
}
