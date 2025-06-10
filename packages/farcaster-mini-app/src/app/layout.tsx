import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/app/globals.css';
import { Providers } from '@/app/providers';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

const satoshi = localFont({
  src: [
    {
      path: '../fonts/Satoshi-Variable.ttf',
      style: 'normal',
    },
    {
      path: '../fonts/Satoshi-VariableItalic.ttf',
      style: 'italic',
    },
  ],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en' className={satoshi.className}>
      <body className='antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
