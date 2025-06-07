import { Button } from "./Button";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function GradientButton3({ children, className = "", ...props }: GradientButtonProps) {
  return (
    <Button
      className={`px-[16px] py-[12px]
        rounded-[12px] bg-app-dark border border-app-light
      disabled:text-gray-100
      text-white shadow-md ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

