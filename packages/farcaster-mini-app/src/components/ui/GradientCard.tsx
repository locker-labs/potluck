import type { ReactNode } from 'react';
import { Card } from './card';

interface GradientCardProps {
  children: ReactNode;
  className?: string;
}

export function GradientCard({ children, className = '' }: GradientCardProps) {
  return (
    <Card
      className={`border border-gray-700 bg-gradient-to-r from-gray-800 to-purple-900 backdrop-blur rounded-2xl py-6 px-4 shadow-sm ${className}`}
    >
      {children}
    </Card>
  );
}

export function GradientCard2({ children, className = '' }: GradientCardProps) {
  return (
    <Card
      className={`border border-app-cyan bg-gradient-to-r from-[#364ea2] to-[#5f008e] backdrop-blur rounded-2xl py-6 px-4 shadow-sm ${className}`}
    >
      {children}
    </Card>
  );
}
