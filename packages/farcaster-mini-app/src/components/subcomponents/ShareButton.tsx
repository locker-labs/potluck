import type React from 'react'
import { ClipboardCheck, Share2 } from 'lucide-react';

const ShareButton = ({ onClick, copied = false }: { onClick: React.MouseEventHandler<HTMLButtonElement>; copied?: boolean }) => {
  return (
    <button
      type="button"
      className="text-gray-400 hover:text-white py-2 pl-2 transition-colors duration-150"
      onClick={onClick}
      aria-label="Share options"
    >
      {copied ? <ClipboardCheck size={20} /> : <Share2 size={20} />}
    </button>
  )
}

export default ShareButton
