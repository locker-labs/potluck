import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const BackButton = ({ className = "" }: { className?: string }) => {
	const router = useRouter();
	return (
		<button
			type="button"
			className={`text-gray-400 hover:text-white py-2 pr-2 transition-colors duration-150 ${className}`}
			onClick={() => router.back()}
			aria-label="Go back"
		>
			<ArrowLeft size={20} />
		</button>
	);
};

export default BackButton;
