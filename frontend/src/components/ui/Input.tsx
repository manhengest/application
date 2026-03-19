interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string;
}

const baseClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed';

export function Input({ className = '', ...props }: InputProps) {
  return <input className={`${baseClasses} ${className}`.trim()} {...props} />;
}
