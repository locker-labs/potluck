import { Button } from "./Button";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function GradientButton({ children, className = "", ...props }: GradientButtonProps) {
  return (
    <Button
      className={` py-[8px] font-bold rounded-[12px] bg-gradient-to-r  from-[#571d84] to-[#a756f2] hover:from-[#4a156c] hover:to-[#944ee2]
      disabled:text-gray-100
      text-white border-0 shadow-md ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

