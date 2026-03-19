interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const baseClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y disabled:opacity-60 disabled:cursor-not-allowed';

export function Textarea({ className = '', ...props }: TextareaProps) {
  return <textarea className={`${baseClasses} ${className}`.trim()} {...props} />;
}
