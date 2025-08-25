import type { Metadata } from "next";
import { getMetadata } from "@/app/metadata";
import Docs from "@/components/pages/Docs";

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata();
}

export default function Create() {
  return (
    <div id={"docs-page"} className={"page-transition"}>
      <Docs />
    </div>
  );
}
