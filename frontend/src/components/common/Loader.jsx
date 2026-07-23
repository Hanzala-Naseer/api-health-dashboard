import { Loader2 } from 'lucide-react';

export default function Loader({ label = 'Loading...', size = 'md', fullHeight = false }) {
  const iconSize = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-text-secondary ${
        fullHeight ? 'min-h-[240px]' : 'py-10'
      }`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={`${iconSize} animate-spin text-primary`} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-surface-container-high ${className}`} />;
}
