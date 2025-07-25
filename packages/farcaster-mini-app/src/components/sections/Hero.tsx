import { Plus } from 'lucide-react';
import { GradientButton } from '../ui/Buttons';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';

export default function Hero() {
  const router = useRouter();

  return (<motion.div layout key="hero">
    <div className='relative mb-[12px] mt-[16px] flex flex-col items-center justify-center px-4 border border-gray-700 rounded-[12px] pt-7 pb-5 shadow-lg bg-gradient-to-r from-gray-800 to-purple-900'>
      <Image
        src='/logo-left-top.png'
        alt=''
        width={44}
        height={44}
        className='absolute top-[33%] left-[5%] opacity-[100%] grayscale aspect-auto'
        priority
      />
      <Image
        src='/logo-left-bottom.png'
        alt=''
        width={70}
        height={70}
        className='absolute top-[55%] left-[16%] grayscale'
        priority
      />
      <Image
        src='/logo-right-top.png'
        alt=''
        width={58}
        height={58}
        className='absolute top-[20%] right-[3%] opacity-[100%] grayscale'
        priority
      />
      <Image
        src='/logo-right-bottom.png'
        alt=''
        width={55}
        height={55}
        className='absolute top-[55%] right-[18%] grayscale'
        priority
      />
      <div className='w-full text-center max-w-3xl mx-auto'>
        <div>
          <p className='font-semibold text-[24px] leading-snug'>Create Pot</p>
          <p className='text-[14px]'>Chip in small. Cash out big.</p>
        </div>
        <div className='w-full'>
          <GradientButton
            className='mt-4 mx-auto font-medium text-lg py-[8px] shadow-lg hover:shadow-xl transition-all duration-300 text-[40px]'
            onClick={() => {
              router.push('/create');
            }}
          >
            <Plus />
          </GradientButton>
        </div>
      </div>
    </div>
  </motion.div>
  );
}
