'use client'

import { usePathname } from "next/navigation";

const frame = (pathname: string) => ({
  version: "next",
  imageUrl: "https://chatty-phones-clean.loca.lt/splash.png",
  button: {
    title: "Join my pot",
    action: {
      type: "launch_frame",
      url: `https://chatty-phones-clean.loca.lt${pathname}`,
      name:"Yoink!",
      splashImageUrl: "https://chatty-phones-clean.loca.lt/icon.png",
      splashBackgroundColor:"#f5f0ec"
    }
  }
})

export function Head() {
    const pathname = usePathname();

    if (pathname.startsWith('/pot/')) {
        return (<head>
            <meta name="fc:frame" content={JSON.stringify(frame(pathname))} />
        </head>);
    }

    return null;
}