"use client";

import { Button } from "../ui/Button";
import { EScreen } from "~/lib/constants";
import { usePotLuck } from "../providers/PotLuckProvider";

export default function LandingPage() {
  const { setScreen } = usePotLuck();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f8f5ff] to-[#eee6ff] px-4">
      <div className="text-center max-w-3xl mx-auto">
        {/* Logo/Icon could be added here */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-[#7C65C1] rounded-full mx-auto flex items-center justify-center">
            <span className="text-white text-2xl font-bold">🍲</span>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-[#7C65C1] mb-4 tracking-tight">
          PotLock
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-700 mb-12 leading-relaxed">
          Chip in small, Cash out big.
        </p>
        
        <Button 
          className="font-medium text-lg py-4 px-8 max-w-md mx-auto shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => setScreen(EScreen.CREATE_POT)}
        >
          Get Started
        </Button>
        
        <div className="mt-12 text-gray-500 text-sm">
          <p>Join the community and start saving together</p>
        </div>
      </div>
    </div>
  );
}
