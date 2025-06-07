import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export default function Drawer({ isOpen, onClose, children }: DrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-64 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Menu</h2>
            <Button onClick={onClose} className="p-1">
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
