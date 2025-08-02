'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { parseUnits } from 'viem';
import { MoveLeft, Copy, Loader2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import Image from 'next/image';
import { formatAddress } from '@/lib/address';
import { GradientButton, GradientButton3 } from '../ui/Buttons';
import { getTransactionLink } from '@/lib/helpers/blockExplorer';
import { useCreatePot } from '@/hooks/useCreatePot';
import { useCopyInviteLink } from '@/hooks/useCopyInviteLink';
import { useCreateCast } from '@/hooks/useCreateCast';
import { formatUnits } from 'viem';
import { z } from 'zod';
import { MAX_PARTICIPANTS } from '@/config';
import { AnimatePresence, motion } from 'motion/react';
import { initialUp, transition, animate } from "@/lib/pageTransition";

const emojis = ["🎯", "🏆", "🔥", "🚀", "💪", "⚡", "🎬", "🎓", "🍕", "☕"];

const timePeriods = [
  { value: BigInt(86400), label: "Daily" },
  { value: BigInt(604800), label: "Weekly" },
  { value: BigInt(2592000), label: "Monthly" },
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
    .refine(
      (val) =>
        val !== "" &&
        !Number.isNaN(Number(val)) &&
        Number(val) <= MAX_PARTICIPANTS,
      {
        message: `Participants must be less than ${MAX_PARTICIPANTS + 1}`,
      }
    )
    .refine((val) => val !== "" && /^\d+$/.test(val) && Number(val) >= 2, {
      message: "Participants must be atleast 2",
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
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
    setPotId,
    handleCreatePot,
    isCreatingPot,
    isLoading,
    hash,
    fee,
    feeUsdc,
  } = useCreatePot();
  const { handleCopyLink } = useCopyInviteLink({ potId: potId });
  const { handleCastOnFarcaster } = useCreateCast({
    potId,
    amount: amountBigInt,
    period: timePeriod,
  });

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

  // EFFECTS
  // Redirect to pot page when success modal is closed
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!showSuccessModal && potId) {
      router.push(`/pot/${potId}`);
      setPotId(null);
    }
  }, [showSuccessModal]);

  // Show success modal when pot is created
  useEffect(() => {
    if (!!hash && !!potId) {
      setShowSuccessModal(true);
    }
  }, [hash, potId]);

  // These are only for rendering
  const amountUsdc: string = formatUnits(amountBigInt, 6);
  const totalAmountUsdc: string = formatUnits(amountBigInt + (fee ?? 0n), 6);

  return (
      <motion.div
          className={'px-4'}
          initial={initialUp}
          animate={animate}
          transition={transition}
      >
      <div>
        <div className="w-full flex items-center justify-start gap-4 mb-8">
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

        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Name */}
          <div>
            <label
              htmlFor="pot-name"
              className="block text-base font-bold mb-2.5"
            >
              Pot Name
            </label>
            <Input
              id="pot-name"
              name="pot-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (clickedSubmit) validate({ name: e.target.value });
              }}
              placeholder="DeFi Warriors"
            />
            <p
              className={`text-xs text-red-500 mt-1 ${
                errors.name ? "visible" : "invisible"
              }`}
            >{`${errors.name}`}</p>
          </div>
          {/* Choose Emoji */}
          <div>
            <label
              htmlFor="choose-emoji"
              className="block text-base font-bold mb-2.5"
            >
              Choose Emoji
            </label>
            <div className="grid grid-cols-5 gap-2">
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
          {/* Entry Amount */}
          <div>
            <label
              htmlFor="enrty-amount"
              className="block text-base font-bold mb-2.5"
            >
              Individual Contribution Amount
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
                  setAmount(value);
                  if (clickedSubmit) validate({ amount: value });
                }
              }}
              onKeyDown={(e) => {
                // Prevent typing minus sign
                if (e.key === "-" || e.key === "e") {
                  e.preventDefault();
                }
              }}
              placeholder="0.00"
              className="w-full"
            />
            <p
              className={`text-xs text-red-500 mt-1 ${
                errors.amount ? "visible" : "invisible"
              }`}
            >{`${errors.amount}`}</p>
          </div>
          {/* Participation Type */}
          <div>
            <div className="flex items-center justify-between">
              <p className="block text-base font-bold">Participation</p>
              <div className="flex items-center gap-4">
                {/* “Invite-Only” label */}
                <span
                  className={`w-[40px] text-right leading-none transition-all duration-250 ${
                    isPublic
                      ? "text-white font-medium text-sm"
                      : "text-gray-400 font-normal text-xs pr-[0.75px]"
                  }`}
                >
                  Public
                </span>

                {/* The actual switch */}
                <label className="relative inline-block w-14 h-7 cursor-pointer">
                  {/* hidden checkbox peer */}
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                  />
                  {/* track */}
                  <span className="absolute inset-0 bg-gray-700 rounded-full peer-checked:bg-app-cyan transition-colors" />
                  {/* knob */}
                  <span className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-all peer-checked:left-8" />
                </label>

                {/* “Open” label */}
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
            <AnimatePresence mode="popLayout">
              {isPublic ? (
                <motion.p
                  key={"participation-public"}
                  className="text-xs text-gray-500 pb-2.5"
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
                  className="text-xs text-gray-500 pb-2.5"
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
          </div>
          {/* Max Participants */}
          <div>
            <label
              htmlFor="max-participants"
              className="block text-base font-bold mb-2.5"
            >
              Max Participants
            </label>
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
                  setMaxParticipants(value);
                  if (clickedSubmit) validate({ maxParticipants: value });
                }
              }}
              onKeyDown={(e) => {
                // Prevent typing minus sign, decimal, or e
                if (e.key === "-" || e.key === "." || e.key === "e") {
                  e.preventDefault();
                }
              }}
              placeholder="e.g. 10"
              className="w-full"
            />
            <p
              className={`text-xs text-red-500 mt-1 ${
                errors.maxParticipants ? "visible" : "invisible"
              }`}
            >{`${errors.maxParticipants}`}</p>
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
          <div className="border border-gray-700 rounded-[12px] px-3 pt-4">
            <div>
              <p className="block text-base font-bold mb-2.5">
                Payment Summary
              </p>

              <div className="mb-2 mt-5 w-full flex items-start justify-between">
                <p className="text-sm font-normal">Participation Amount:</p>
                <p className="text-sm font-normal">{amountUsdc} USDC</p>
              </div>

              <div className="mb-2 w-full flex items-start justify-between">
                <p className="text-sm font-normal">Platform Fee:</p>
                <p className="text-sm font-normal">{feeUsdc} USDC</p>
              </div>

              <hr />

              <div className="mt-2 mb-3 w-full flex items-start justify-between">
                <p className="text-sm font-bold">Total:</p>
                <p className="text-sm font-bold">{totalAmountUsdc} USDC</p>
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
                  You will be asked to confirm a wallet transaction. Please
                  ensure you have enough funds available.
                </p>
              </div>
            </div>
          </div>
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
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md rounded-2xl text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              Congratulations! 🎉
            </DialogTitle>
            <div className="text-center">
              <div>
                <Image
                  src="/success.gif"
                  alt="Success"
                  width={150}
                  height={150}
                  className="mx-auto rounded-full"
                  priority
                />
                <h3 className="text-xl font-bold mb-2">
                  Your pot has been created!
                </h3>
                <p className="mb-6">
                  Share with friends to start saving together. The more people
                  that join, the more everyone saves!
                </p>
                {hash && (
                  <div className="flex w-full items-center justify-center gap-2">
                    <p>Transaction Hash: </p>
                    <Link href={getTransactionLink(hash)} target="_blank">
                      <div className="flex items-center justify-center gap-2">
                        <p>{formatAddress(hash)}</p>
                        <ExternalLink size={16} color="#ffffff" />
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <GradientButton3
              type="button"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleCastOnFarcaster}
            >
              <Image
                src="/farcaster-transparent-white.svg"
                alt="Farcaster"
                width={22}
                height={22}
                priority
              />
              <span className="text-[20px] font-medium">Cast on Farcaster</span>
            </GradientButton3>

            <GradientButton3
              className="w-full flex items-center justify-center gap-2"
              onClick={handleCopyLink}
            >
              <Copy size={18} />
              <span className="text-[20px] font-medium">Copy Invite Link</span>
            </GradientButton3>

            <Link
              href={`/pot/${potId}`}
              className="w-full"
              prefetch={showSuccessModal}
            >
              <div className="w-full text-center rounded-xl py-3 mt-4 bg-white/80">
                <span className="text-[20px] text-center font-medium text-black">
                  Go to Pot
                </span>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
