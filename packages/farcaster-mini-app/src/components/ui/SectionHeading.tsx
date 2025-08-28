import type React from "react";

interface SectionHeadingProps {
    children: React.ReactNode;
    className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ children, className = "" }) => (
    <h2 className={`text-2xl font-bold mb-3 ${className}`.trim()}>{children}</h2>
);