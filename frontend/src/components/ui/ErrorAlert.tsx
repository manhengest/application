interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm" role="alert">
      {message}
    </div>
  );
}
