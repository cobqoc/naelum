import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  message: string;
  subMessage?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  icon = '📭',
  message,
  subMessage,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-text-muted text-lg">{message}</p>
      {subMessage && (
        <p className="text-text-muted text-sm mt-2">{subMessage}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-block px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
