"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type DropDownProps = {
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string; // replaces container classes entirely if provided
  headerClassName?: string; // optional: replace header button classes
  contentClassName?: string; // replaces the outer open content container
  innerClassName?: string; // replaces the inner padding/content wrapper
};

export function DropDown({
  header,
  children,
  defaultOpen = false,
  className,
  headerClassName,
  contentClassName,
  innerClassName,
}: DropDownProps) {
  const [open, setOpen] = useState(defaultOpen);

  const defaultContainer =
    "bg-gray-800 rounded-xl overflow-hidden border border-gray-700";
  const defaultHeaderBtn =
    "w-full flex justify-between items-center text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 transition-colors";
  const defaultContentOuter = "border-t border-gray-700 bg-gray-900";
  const defaultContentInner = "p-4 text-gray-200";

  return (
    <div className={className ?? defaultContainer}>
      <button
        className={headerClassName ?? defaultHeaderBtn}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 text-white font-medium">
          {header}
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {open && (
        <div className={contentClassName ?? defaultContentOuter}>
          <div className={innerClassName ?? defaultContentInner}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
