import Link from 'next/link';
import Image from 'next/image';

export default function NavBar() {
  return (
    <nav className="backdrop-blur fixed top-0 left-0 right-0 z-50 shadow-sm px-4 pt-5 pb-3">
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Image
            src="/potluck-logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="min-w-[40px] max-w-[40px] aspect-auto object-cover"
            draggable="false"
          />
          <Link href="/" className="text-[20px] font-bold uppercase">
            {process.env.NEXT_PUBLIC_FRAME_NAME}
          </Link>
        </div>
      </div>
    </nav>
  );
}
