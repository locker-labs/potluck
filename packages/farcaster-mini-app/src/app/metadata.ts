import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "@/lib/constants";
import { getFrameEmbedMetadata } from "@/lib/utils";

export function getMetadata(params?: {
	path?: string;
	title?: string;
	description?: string;
	twitter?: { title?: string };
    openGraph?: { title?: string; };
}) {
	const pathname = params?.path;
	const title = params?.title || APP_NAME;
	const description = params?.description || APP_DESCRIPTION;
    const twitterTitle = params?.twitter?.title || title;
    const openGraphTitle = params?.openGraph?.title || title;

	const metadata = {
		title,
		description,
		openGraph: {
			title: openGraphTitle,
			description,
			images: [APP_OG_IMAGE_URL],
		},
		twitter: {
			card: "summary_large_image",
			title: twitterTitle,
			description,
			creator: "@locker_money",
			images: [
				{
					url: APP_OG_IMAGE_URL,
					width: 800,
					height: 600,
					alt: "twitterimage",
				},
			],
		},
		other: {
			"fc:frame": JSON.stringify(getFrameEmbedMetadata({ pathname })),
		},
	};

	return metadata;
}
