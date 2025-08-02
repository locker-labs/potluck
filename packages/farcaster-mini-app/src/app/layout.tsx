'use client'

import type { ReactNode } from 'react';
import '@/app/globals.css';
import { Providers } from '@/app/providers';
import { font } from '@/app/font';
import AppLayout from '@/components/AppLayout';
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en' className={font.className}>
      <body className='antialiased font-sans'>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster position='bottom-right' />
        </Providers>
      </body>
    </html>
  );
}
