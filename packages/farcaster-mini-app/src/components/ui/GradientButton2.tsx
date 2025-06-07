import { Button } from "./Button";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  isActive?: boolean;
  isLoading?: boolean;
}

export function GradientButton2({ children, isLoading = false, className = "", isActive = false, ...props }: GradientButtonProps) {
  return (
    <Button
      isLoading={isLoading}
      className={`transition-colors
        font-medium text-sm text-white
        px-[16px] py-3
        rounded-full
        ${isActive
          ? 'bg-gradient-to-r from-app-cyan to-[#a756f2] hover:from-app-cyan hover:to-[#a756f2]'
          : 'border border-[1.75px] border-[#9ca3ae] bg-[#1f2936]'}
      disabled:text-gray-100
      shadow-md ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

