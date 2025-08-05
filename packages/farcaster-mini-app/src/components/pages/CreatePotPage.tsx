'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { parseUnits } from 'viem';
import { MoveLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { GradientButton, GradientButton3 } from '../ui/Buttons';
import { useCreatePot } from '@/hooks/useCreatePot';
import { formatUnits } from 'viem';
import { z } from 'zod';
import { MAX_PARTICIPANTS } from '@/config';
import { AnimatePresence, motion } from 'motion/react';
import { initialDown, transition, animate } from "@/lib/pageTransition";
import { CreatePotSuccessDialog } from '@/components/subcomponents/CreatePotSuccessDialog';
import { daySeconds, weekSeconds, monthSeconds } from '@/lib/helpers/contract';

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
const createPotSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z
    .string()
    .refine(
      (val) => val !== "" && !Number.isNaN(Number(val)) && Number(val) >= 0.01,
      {
        message: "Amount must be at least 0.01",
      }
    )
    .refine(
      (val) => {
        // Accept only up to two decimal places
        if (val === "") return true;
        return /^\d+(\.\d{1,2})?$/.test(val);
      },
      {
        message: "Only 2 decimal places allowed",
      }
    ),
  maxParticipants: z
    .string()
    .refine((val) => !Number.isNaN(Number(val)), {
      message: "Value must be a number",
    })
    .refine(
      (val) => !Number.isNaN(Number(val)) &&
        Number(val) <= MAX_PARTICIPANTS,
      {
        message: `Members cannot be more than ${MAX_PARTICIPANTS}`,
      }
    )
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) !== 1, {
      message: "Members should be more than 1",
    }),
  emoji: z.string().min(1, "Emoji is required"),
  timePeriod: z.bigint(),
});

export default function CreatePotPage() {
  const [emoji, setEmoji] = useState<string>(emojis[0]);
  const [name, setName] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<bigint>(timePeriods[0].value);
  const [amount, setAmount] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [clickedSubmit, setClickedSubmit] = useState(false);

  const potName = `${emoji} ${name.trim()}`;
  const amountBigInt = BigInt(parseUnits(amount, 6));
  const maxParticipantsInt = maxParticipants
    ? Number.parseInt(maxParticipants, 10)
    : 0;

  const router = useRouter();
  const {
    potId,
    handleCreatePot,
    isCreatingPot,
    isLoading,
    hash,
    calculateJoineeFee,
    calculateCreatorFee,
    platformFeeWei,
    platformFeeEth,
  } = useCreatePot();
  

  const hasErrors = Object.keys(errors).length > 0;

  const disabled = isLoading || isCreatingPot || (clickedSubmit && hasErrors);

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
    const result = createPotSchema.safeParse(values);
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
  const amountUsdc: string = formatUnits(amountBigInt, 6);
  const roundsForFee =
			maxParticipantsInt === 0
				? MAX_PARTICIPANTS // default to MAX_PARTICIPANTS if not set
				: maxParticipantsInt === 1
					? undefined
					: maxParticipantsInt <= MAX_PARTICIPANTS
						? maxParticipantsInt
						: undefined;
  const totalGasFee = roundsForFee ? calculateJoineeFee(roundsForFee) : undefined;
  const totalFee = roundsForFee ? calculateCreatorFee(roundsForFee) : undefined;

  return (
      <motion.div
          className={'px-4'}
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
              className="block text-base font-bold"
            >
              Goal
            </label>
            <Input
              className='mt-2'
              id="pot-name"
              name="pot-name"
              type="text"
              value={name}
              onChange={(e) => {
                setTouched((prev) => ({ ...prev, name: true }));
                setName(e.target.value);
                if (clickedSubmit || touched.name) validate({ name: e.target.value });
              }}
              placeholder="DeFi Warriors"
            />
            <p
              className={`text-xs text-red-500 mt-1 ${
                ((clickedSubmit || touched.name) && errors.name) ? "visible" : "hidden"
              }`}
            >{`${errors.name}`}</p>
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
              className="block text-base font-bold mb-2.5"
            >
              Amount
            </label>
            <Input
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
                  if (clickedSubmit || touched.amount) validate({ amount: value });
                }
              }}
              onKeyDown={(e) => {
                // Prevent typing minus sign
                if (e.key === "-" || e.key === "e") {
                  e.preventDefault();
                }
              }}
              placeholder="20"
              className="w-full"
            />
            <p
              className={`text-xs text-red-500 mt-1 ${
                ((clickedSubmit || touched.amount) && errors.amount) ? "visible" : "hidden"
              }`}
            >{`${errors.amount}`}</p>
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
              className="block text-base font-bold"
            >
              Max Members
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
                  if (clickedSubmit || touched.maxParticipants) validate({ maxParticipants: value });
                }
              }}
              onKeyDown={(e) => {
                // Prevent typing minus sign, decimal, or e
                if (e.key === "-" || e.key === "." || e.key === "e") {
                  e.preventDefault();
                }
              }}
              placeholder="Default is 255"
              className="w-full mt-2"
            />
            <p
              className={`text-xs text-red-500 mt-1 ${
                ((clickedSubmit || touched.maxParticipants) && errors.maxParticipants) ? "visible" : "hidden"
              }`}
            >{`${errors.maxParticipants}`}</p>
          </div>
          
          {/* Payment Summary */}
          <div className="border border-gray-700 rounded-[12px] px-3 pt-4">
            <div>
              <p className="block text-base font-bold mb-2">
                Payment Summary
              </p>

              <div className="mb-2 mt-5 w-full flex items-start justify-between">
                <p className="text-sm font-normal">Join Amount:</p>
                <p className="text-sm font-normal">{amountUsdc} USDC</p>
              </div>

              <div className="mb-2 w-full flex items-start justify-between">
                <p className="text-sm font-normal">Platform Fee:</p>
                <p className="text-sm font-normal">{platformFeeEth ? `${platformFeeEth} ETH` : '-'}</p>
              </div>

              <div className="mb-2 w-full flex items-start justify-between">
                <p className="text-sm font-normal">Total Gas Fee {roundsForFee ? `(${roundsForFee} rounds)` : null}:</p>
                <p className="text-sm font-normal">{totalGasFee ? `${totalGasFee.formatted} ETH` : '-'}</p>
              </div>

              <div className="mb-2 w-full flex items-start justify-between">
                <p className="text-sm font-normal">Total Fee:</p>
                <p className="text-sm font-normal">{totalFee ? `${totalFee.formatted} ETH` : '-'}</p>
              </div>

              <hr />

              <div className="mt-2 mb-3 w-full flex items-start justify-between">
                <p className="text-sm font-bold">Total:</p>
                <p className="text-sm font-bold">{amountUsdc} USDC</p>
              </div>

              <div className="mt-2 mb-3 w-full flex items-start justify-between border border-[#FFB300] rounded-[8px] bg-[#45412E] py-2 px-4">
                <Image
                  className="mr-3"
                  src="/warning.png"
                  alt="warning"
                  width={32}
                  height={32}
                />
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
