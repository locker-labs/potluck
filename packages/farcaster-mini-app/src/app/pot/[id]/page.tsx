import type { Metadata } from "next";
import { getMetadata } from "@/app/metadata";
import PotPage from "@/components/pages/PotPage";
import type { TPotObjectMini } from "@/lib/types";
import { fetchPotMiniInfo } from "@/lib/graphQueries";

type Props = {
	params: Promise<{ id: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;

	if (!id || Number.isNaN(Number(id))) return getMetadata();

	try {
		const pot: TPotObjectMini =
			await fetchPotMiniInfo(BigInt(id));
		const socialTitle = `Save with me for a chance to win ${pot.totalPool} USDC`;

		return getMetadata({
			path: `/pot/${Number(id)}`,
			twitter: { title: socialTitle },
			openGraph: { title: socialTitle },
		});
	} catch (e) {
		console.error("Error fetching pot metadata:", e);
	}

	return getMetadata();
}

export default async function Page({ params }: Props) {
	const { id } = await params;
	if (!id) return null;

	return <PotPage id={id} />;
}
