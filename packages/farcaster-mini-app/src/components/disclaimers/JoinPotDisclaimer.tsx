import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MotionButton } from "../ui/Buttons";

type PotDisclaimerType = "public" | "private";

const DISCLAIMER_TEXTS: Record<
  PotDisclaimerType,
  { title: string; body: string }
> = {
  public: {
    title: "Public Pot Disclaimer",
    body: `In public pots, funds can be at risk if the current round’s winner does not rejoin or fulfill expected participation. Only join if you understand and accept this risk.

 ⚠️ Important: Missing your contribution in any round will negatively impact your reputation and lead to being excluded from other pots in the future. Build your reputation with honest behaviour.`,
  },
  private: {
    title: " Private Pot Disclaimer",
    body: `Private pots are approval-only. Join with your friends and people you trust. All contributions and withdrawals are transparent on-chain.

 ⚠️ Important: Missing your contribution in any round will negatively impact your reputation and lead to being excluded from other pots in the future. Build your reputation with honest behaviour.`,
  },
};

export function JoinPotDisclaimer() {
  const [open, setOpen] = useState(false);
  const [currentType, setCurrentType] = useState<PotDisclaimerType>("public");
  const resolverRef = useRef<(confirmed: boolean) => void>();

  // Opens the disclaimer and returns a promise that resolves when it's closed
  const askDisclaimer = useCallback((type: PotDisclaimerType) => {
    setCurrentType(type);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  // Close helpers
  const resolveAndClear = (value: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = undefined;
    if (resolve) resolve(value);
  };

  const handleDismiss = () => {
    setOpen(false);
    // Treat backdrop/escape close as "not acknowledged"
    resolveAndClear(false);
  };

  const handleGotIt = () => {
    setOpen(false);
    // Only "Got it!" acknowledges and allows the flow to continue
    resolveAndClear(true);
  };

  const DisclaimerModal = () =>
    open ? (
      <Dialog
        open={open}
        onOpenChange={(isOpen) => (!isOpen ? handleDismiss() : null)}
      >
        <DialogContent
          className="rounded-2xl w-md max-w-[calc(100vw-32px)]"
          showClose={false}
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {DISCLAIMER_TEXTS[currentType].title}
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-gray-200 whitespace-pre-line">
            {DISCLAIMER_TEXTS[currentType].body}
          </div>
          <DialogFooter>
            <MotionButton onClick={handleGotIt}>Got it!</MotionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ) : null;

  return { askDisclaimer, DisclaimerModal };
}
