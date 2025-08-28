import type React from "react";
import { GradientCard } from "@/components/ui/GradientCard";
import { SectionHeading } from "../ui/SectionHeading";
const Reputation: React.FC = () => {
	return (
		<div>
			<SectionHeading>Reputation</SectionHeading>
			<GradientCard>
				{/* <p className="text-xl font-normal text-app-light leading-none">Reputation</p> */}

				<p className="text-[36px] text-purple-600 font-semibold leading-none">
					Coming soon
				</p>

				<div className="mt-3">
					<p className="text-gray-200/90 text-sm">
						Your reputation will be based on your activity and positive
						participation in pots. The more you save and engage honestly, the
						more you&apos;ll earn. Stay tuned for rewards and benefits tied to
						your reputation score.
					</p>
				</div>
			</GradientCard>
		</div>
	);
};

export default Reputation;
