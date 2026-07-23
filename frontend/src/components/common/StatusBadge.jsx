const ENDPOINT_STATUS_STYLES = {
  UP: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'Online' },
  DOWN: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', label: 'Offline' },
  DEGRADED: {
    dot: 'bg-warning',
    text: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    label: 'Slow',
  },
  TIMEOUT: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', label: 'Timeout' },
  ERROR: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', label: 'Error' },
  UNKNOWN: {
    dot: 'bg-text-muted',
    text: 'text-text-secondary',
    bg: 'bg-surface-container-high',
    border: 'border-border-strong',
    label: 'Unknown',
  },
};

const SEVERITY_STYLES = {
  LOW: { text: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  MEDIUM: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  HIGH: { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
  CRITICAL: { text: 'text-danger', bg: 'bg-danger/15', border: 'border-danger/30' },
};

export default function StatusBadge({ status, showDot = true }) {
  const style = ENDPOINT_STATUS_STYLES[status] || ENDPOINT_STATUS_STYLES.UNKNOWN;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${style.bg} ${style.border} ${style.text}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />}
      {style.label}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.MEDIUM;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${style.bg} ${style.border} ${style.text}`}
    >
      {severity}
    </span>
  );
}

export function MethodBadge({ method }) {
  return (
    <span className="inline-flex items-center rounded-md bg-surface-container-high px-2 py-0.5 font-mono-code text-xs font-medium text-text-secondary">
      {method}
    </span>
  );
}
