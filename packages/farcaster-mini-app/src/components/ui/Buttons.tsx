import { SimpleButton } from '@/components/ui/SimpleButton';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function GradientButton({
  children,
  className = '',
  isLoading = false,
  ...props
}: ButtonProps) {
  return (
    <SimpleButton
      isLoading={isLoading}
      className={`py-[8px] font-bold rounded-[12px]
      bg-gradient-to-r  from-[#571d84] to-[#a756f2] hover:from-[#4a156c] hover:to-[#944ee2]
      disabled:text-gray-100
      text-white border-0 shadow-md ${className}`}
      {...props}
    >
      {children}
    </SimpleButton>
  );
}

interface GradientButton2Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  isActive?: boolean;
  isLoading?: boolean;
}



export function GradientButton2({
  children,
  isLoading = false,
  className = '',
  isActive = false,
  ...props
}: GradientButton2Props) {
  return (
    <SimpleButton
      isLoading={isLoading}
      className={`px-[16px]
        ${
          isActive
          ? 'text-white'
          : 'text-white/60 hover:text-white/90'
        }
        ${
          isActive
          ? 'bg-gradient-to-r from-app-cyan to-[#a756f2]'
          : 'bg-[#1f2936]'
        }
        ring-inset ring-2
        ${
          isActive
          ? 'ring-transparent'
          : ' ring-[#9ca3ae] hover:ring-[#a756f2]'
        }
      disabled:text-gray-100
      shadow-md ${className}`}
      {...props}
    >
      {children}
    </SimpleButton>
  );
}

export function GradientTransitionButton2({
  children,
  isLoading = false,
  className = '',
  isActive = false,
  ...props
}: GradientButton2Props) {
  return (
    // gradient div set as background of button
    <div className={`m-0 p-0 flex items-center justify-center rounded-full
        transition-all duration-300 ease-in
        bg-gradient-to-r from-app-cyan to-[#a756f2]`}
    >
    <SimpleButton
      isLoading={isLoading}
      className={`px-[16px]
        ${
          isActive
            ? 'text-white'
            : 'text-white/60 hover:text-white/90'
        }
        bg-[#1f2936]
        ${
          isActive
            ? 'bg-opacity-0'
            : 'bg-opacity-100'
        }
        ring-inset ring-2
        ${
          isActive
            ? 'ring-transparent'
            : ' ring-[#9ca3ae] hover:ring-[#a756f2]'
        }
      disabled:text-gray-100
      shadow-md ${className}`}
      {...props}
    >
      {children}
    </SimpleButton>
    </div>
  );
}

export function GradientButton3({ children, className = '', ...props }: ButtonProps) {
  return (
    <SimpleButton
      className={`px-[16px] py-[12px]
        rounded-[12px] bg-app-dark border border-app-light
      disabled:text-gray-100
      text-white shadow-md ${className}`}
      {...props}
    >
      {children}
    </SimpleButton>
  );
}

export function GradientButton4({
  children,
  isLoading = false,
  className = '',
  isActive = false,
  ...props
}: GradientButton2Props) {
  return (
    <SimpleButton
      isLoading={isLoading}
      {...props}
      className={`px-0 py-0 font-bold text-[12px] text-white
        rounded-[12px]
        ${
          isActive
            ? `bg-gradient-to-r from-app-cyan via-[#5779e7] to-[#a756f2]
              hover:from-app-cyan hover:via-[#5779e7] hover:to-[#a756f2]`
            : 'border-[1.75px] border-[#9ca3ae] bg-[#1f2936]'
        }
      disabled:text-gray-100
      shadow-md ${className}`}
    >
      {children}
    </SimpleButton>
  );
}

export function BorderButton({ children, className = '', ...props }: ButtonProps) {
  return (
    <SimpleButton
      className={`px-0 py-0 font-bold text-[12px] text-white
      rounded-[12px] border border-purple-400 shadow-md    
      disabled:text-gray-100 ${className}`}
      {...props}
    >
      {children}
    </SimpleButton>
  );
}
