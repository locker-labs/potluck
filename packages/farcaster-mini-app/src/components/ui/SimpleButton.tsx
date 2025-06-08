interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function SimpleButton({
  children,
  className = '',
  isLoading = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`max-w-full block py-3 px-6 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className='flex items-center justify-center'>
          <div className='animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full' />
        </div>
      ) : (
        children
      )}
    </button>
  );
}
