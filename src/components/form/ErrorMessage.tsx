interface ErrorMessageProps {
  message?: string[] | string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  const messages = Array.isArray(message) ? message : [message];
  if (messages.length === 0) return null;

  return (
    <div className="mt-1 flex flex-col gap-0.5">
      {messages.map((msg) => (
        <p key={msg} className="text-destructive text-sm">
          {msg}
        </p>
      ))}
    </div>
  );
}
