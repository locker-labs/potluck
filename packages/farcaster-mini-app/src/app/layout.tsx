import type { Metadata } from "next";
import localFont from 'next/font/local'
import { getSession } from "@/auth"
import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { Head } from "./head";

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
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  
  const session = await getSession()

  return (
    <html lang="en" className={satoshi.className}>
      <body className="antialiased">
        <Head/>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
