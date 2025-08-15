import React from "react";
import { GradientButton3 } from "../ui/Buttons";
import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const BackButton = () => {
	const router = useRouter();
	return (
		<GradientButton3 onClick={() => router.back()} className="text-sm">
			<MoveLeft size={20} />
		</GradientButton3>
	);
};

export default BackButton;
