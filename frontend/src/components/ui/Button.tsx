interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50',
  secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
};

export function Button({
  variant = 'primary',
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed';
  const variantClass = variantClasses[variant];
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
