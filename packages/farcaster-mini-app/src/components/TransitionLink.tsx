"use client";
import Link, { type LinkProps } from "next/link";
import type React from "react";
import { useRouter, usePathname } from "next/navigation";

interface TransitionLinkProps extends LinkProps {
    children: React.ReactNode;
    href: string;
    className?: string;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const TransitionLink: React.FC<TransitionLinkProps> = ({
  children,
  href,
  className = '',
  ...props
}) => {
    const router = useRouter();
    const pathname = usePathname();

    const handleTransition = async (
        e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) => {
        e.preventDefault();
        let pageId = 'home-page';
        if (pathname === '/') {
            pageId = 'home-page';
        } else if (pathname === '/create') {
            pageId = 'create-page';
        } else if (pathname.startsWith('/pot/')) {
            pageId = 'pot-page';
        }

        const element = document.getElementById(pageId);
        element?.classList.add("page-transition-hide");
        await sleep(250);
        router.push(href);
    };

    return (
        <Link {...props} href={href} className={className} onClick={handleTransition}>
            {children}
        </Link>
    );
};