import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME, fallbackPfpUrl } from '@/lib/constants';
import { TransitionLink } from './TransitionLink';
import { useConnection } from '@/hooks/useConnection';
import { MotionButton } from './ui/Buttons';

export default function NavBar() {
  const { address, ensureConnection } = useConnection();
  
  return (
    <nav className='backdrop-blur fixed top-0 left-0 right-0 z-50 shadow-sm px-4 pt-5 pb-3'>
      <div className='w-full flex justify-between items-center'>
        <div className='flex items-center space-x-2'>
          <Link href='/'>
          <Image
            src='/logo.png'
            alt='Logo'
            width={40}
            height={40}
            className='min-w-[40px] max-w-[40px] aspect-auto object-cover'
            draggable='false'
          />
          </Link>
          <Link href='/' className='text-[24px] font-bold uppercase'>
            {APP_NAME}
          </Link>
        </div>

        {address ? <div className='flex items-center'>
          <TransitionLink href={`/profile/${address}`} prefetch={true}>
            <Image
              src={fallbackPfpUrl}
              alt='Profile'
              width={40}
              height={40}
              className='rounded-full object-cover transition-all duration-100 ease-in outline outline-0 hover:outline-4 outline-[#571d84]'
              // outline outline-2 
              draggable='false'
            />
          </TransitionLink>
        </div> : <MotionButton
            outerDivStyle={{ marginLeft: 0, marginRight: 0 }}
            className='font-medium text-lg py-[8px] shadow-lg hover:shadow-xl text-[40px]'
            onClick={() => {
              try {
                ensureConnection();
              } catch {}
            }}
          >
            Connect
          </MotionButton>}
      </div>
    </nav>
  );
}
