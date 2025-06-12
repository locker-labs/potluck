import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          `flex h-10 w-full rounded-md
          border border-app-light focus:border-app-cyan focus:border-2
          bg-app-dark
          px-3 py-2 text-base md:text-sm
          placeholder:text-neutral-500
          outline-none
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
