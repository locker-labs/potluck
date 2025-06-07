import { Plus } from "lucide-react";
import { GradientButton } from "../ui/GradientButton";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (<div className="mb-[48px] mt-[14px] flex flex-col items-center justify-center px-4 border border-gray-700 rounded-[12px] pt-7 pb-5 shadow-lg">
        <div className="w-full text-center max-w-3xl mx-auto">
        <div>
          <p className="font-semibold text-[24px] leading-snug">Create Pot</p>
          <p className="text-[14px]">Chip in small. Cash out big.</p>
        </div>
        <div className="w-full">
          <GradientButton
            className="mt-4 mx-auto font-medium text-lg py-[8px] shadow-lg hover:shadow-xl transition-all duration-300 text-[40px]"
            onClick={() => { router.push('/create')}}
          >
            <Plus />
          </GradientButton>
        </div>
        </div>
      </div>);
}
