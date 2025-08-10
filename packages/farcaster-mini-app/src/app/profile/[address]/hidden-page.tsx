import type { Metadata } from "next";
import { getMetadata } from "@/app/metadata";
import Profile from "@/components/pages/Profile";
import { isAddress } from "viem";
import { notFound } from "next/navigation";

export type ProfileProps = {
    params: Promise<{ address: string }>;
}


export async function generateMetadata(): Promise<Metadata> {
  return getMetadata({ path: "/create" });
}

export default async function ProfilePage({ params }: ProfileProps) {
  const { address } = await params;
  if (!address) return null;

  if (!isAddress(address)) {
    return notFound();
  }

  return (
    <div id={"profile-page"} className={"page-transition"}>
      <Profile address={address} />
    </div>
  );
}
