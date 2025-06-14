import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          `flex h-10 w-full rounded-md
          outline outline-1 outline-app-light
          focus:outline-2 focus:outline-app-cyan
          bg-app-dark focus:bg-app-dark active:bg-app-dark  
          px-3 py-2 text-base
          placeholder:text-neutral-500
          disabled:cursor-not-allowed disabled:opacity-50
          file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-950
          `,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
