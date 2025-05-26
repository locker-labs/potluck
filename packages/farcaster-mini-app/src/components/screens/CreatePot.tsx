"use client";

import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { usePotLuck } from "../providers/PotLuckProvider";
import { EScreen } from "~/lib/constants";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "~/components/ui/select";

const timePeriods = [
  { value: "1w", label: "1 Week" },
  { value: "2w", label: "2 Weeks" },
  { value: "1m", label: "1 Month" },
  { value: "2m", label: "2 Months" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
];

export default function CreatePotPage() {
  const { setScreen } = usePotLuck();
  const [timePeriod, setTimePeriod] = useState(timePeriods[0].value);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.warning("Invalid amount", {
        description: "Please enter a valid USDC amount greater than 0."
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would typically:
      // 1. Connect to wallet
      // 2. Create the PotLuck contract
      // 3. Submit the transaction 
      console.log("Creating PotLuck with:", { timePeriod, amount: Number.parseFloat(amount) });
      
      // For now just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to success page or dashboard
      // router.push('/dashboard');
      
      toast.success("PotLuck created successfully!", {
        description: "Your pot has been created and is ready for contributions.",
        action: {
          label: "View",
          onClick: () => console.log("Viewed pot details"),
        },
      });
    } catch (error) {
      console.error("Error creating PotLuck:", error);
      toast.error("Error creating PotLuck", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f8f5ff] to-[#eee6ff] px-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#7C65C1] mb-2">Create PotLuck</h1>
          <p className="text-gray-600">Set up your savings pot and invite friends</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="time-period" className="block text-sm font-medium text-gray-700 mb-1">
              Time Period
            </label>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger 
                id="time-period" 
                className="text-black focus:ring-[#7C65C1] focus:border-[#7C65C1]"
              >
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                {timePeriods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              USDC Amount (on BASE)
            </label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-black w-full"
              />
              {/* <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">USDC</span>
              </div> */}
            </div>
          </div>

          <Button 
            type="submit" 
            className="mt-8 py-3"
            isLoading={isSubmitting}
            disabled={isSubmitting || !amount}
          >
            Create PotLuck
          </Button>
        </form>

        <button 
          type="button"
          onClick={() => setScreen(EScreen.LANDING_PAGE)}
          className="mt-6 text-[#7C65C1] text-sm block mx-auto hover:underline"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
