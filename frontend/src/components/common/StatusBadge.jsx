
// const ENDPOINT_STATUS_STYLES = {
//   UP: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'Online' },
//   DOWN: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', label: 'Offline' },
//   DEGRADED: {
//     dot: 'bg-warning',
//     text: 'text-warning',
//     bg: 'bg-warning/10',
//     border: 'border-warning/20',
//     label: 'Slow',
//   },
//   TIMEOUT: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', label: 'Timeout' },
//   ERROR: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', label: 'Error' },
//   // V1.5 — New authentication error states
//   AUTHENTICATION_FAILED: {
//     dot: 'bg-danger',
//     text: 'text-danger',
//     bg: 'bg-danger/10',
//     border: 'border-danger/20',
//     label: 'Auth Failed',
//   },
//   TOKEN_EXTRACTION_FAILED: {
//     dot: 'bg-danger',
//     text: 'text-danger',
//     bg: 'bg-danger/10',
//     border: 'border-danger/20',
//     label: 'Token Error',
//   },
//   UNKNOWN: {
//     dot: 'bg-text-muted',
//     text: 'text-text-secondary',
//     bg: 'bg-surface-container-high',
//     border: 'border-border-strong',
//     label: 'Unknown',
//   },
// };

// const SEVERITY_STYLES = {
//   LOW: { text: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
//   MEDIUM: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
//   HIGH: { text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
//   CRITICAL: { text: 'text-danger', bg: 'bg-danger/15', border: 'border-danger/30' },
// };

// export default function StatusBadge({ status, showDot = true }) {
//   const style = ENDPOINT_STATUS_STYLES[status] || ENDPOINT_STATUS_STYLES.UNKNOWN;

//   return (
//     <span
//       className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${style.bg} ${style.border} ${style.text}`}
//     >
//       {showDot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />}
//       {style.label}
//     </span>
//   );
// }

// export function SeverityBadge({ severity }) {
//   const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.MEDIUM;
//   return (
//     <span
//       className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${style.bg} ${style.border} ${style.text}`}
//     >
//       {severity}
//     </span>
//   );
// }

// export function MethodBadge({ method }) {
//   return (
//     <span className="inline-flex items-center rounded-md bg-surface-container-high px-2 py-0.5 font-mono-code text-xs font-medium text-text-secondary">
//       {method}
//     </span>
//   );
// }

// // V1.5 — Authentication Type Badge
// // src/components/common/StatusBadge.js
// export function AuthTypeBadge({ authType }) {
//   const authConfig = {
//     'NONE': { label: 'None', className: 'bg-gray-100 text-gray-600' },
//     'STATIC_BEARER': { label: 'Bearer Token', className: 'bg-blue-100 text-blue-700' },
//     'API_KEY': { label: 'API Key', className: 'bg-purple-100 text-purple-700' },
//     'BASIC': { label: 'Basic Auth', className: 'bg-yellow-100 text-yellow-700' },
//     'LOGIN_FLOW': { label: 'Login Flow', className: 'bg-green-100 text-green-700' },
//   };

//   const type = authType?.toUpperCase() || 'NONE';
//   const config = authConfig[type] || authConfig['NONE'];

//   return (
//     <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
//       {config.label}
//     </span>
//   );
// }

// src/components/common/StatusBadge.js

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
  // V1.5 — New authentication error states
  AUTHENTICATION_FAILED: {
    dot: 'bg-danger',
    text: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    label: 'Auth Failed',
  },
  TOKEN_EXTRACTION_FAILED: {
    dot: 'bg-danger',
    text: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    label: 'Token Error',
  },
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

// ============================================================
// V1.5 — Authentication Type Configuration (FIXED)
// ============================================================
const AUTH_TYPE_STYLES = {
  NONE: { 
    label: 'None', 
    className: 'bg-gray-100 text-gray-600 border border-gray-200' 
  },
  STATIC_BEARER: { 
    label: 'Bearer Token', 
    className: 'bg-blue-100 text-blue-700 border border-blue-200' 
  },
  API_KEY: { 
    label: 'API Key', 
    className: 'bg-purple-100 text-purple-700 border border-purple-200' 
  },
  BASIC: { 
    label: 'Basic Auth', 
    className: 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
  },
  LOGIN_FLOW: { 
    label: 'Login Flow', 
    className: 'bg-green-100 text-green-700 border border-green-200' 
  },
};

// ============================================================
// Main Component - StatusBadge
// ============================================================
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

// ============================================================
// Component - SeverityBadge
// ============================================================
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

// ============================================================
// Component - MethodBadge (FIXED: More consistent styling)
// ============================================================
const METHOD_STYLES = {
  GET: { className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  POST: { className: 'bg-green-100 text-green-700 border border-green-200' },
  PUT: { className: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  DELETE: { className: 'bg-red-100 text-red-700 border border-red-200' },
  PATCH: { className: 'bg-purple-100 text-purple-700 border border-purple-200' },
  HEAD: { className: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
  OPTIONS: { className: 'bg-pink-100 text-pink-700 border border-pink-200' },
};

export function MethodBadge({ method }) {
  const style = METHOD_STYLES[method?.toUpperCase()] || { 
    className: 'bg-surface-container-high text-text-secondary border border-border' 
  };
  
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}
    >
      {method?.toUpperCase() || 'UNKNOWN'}
    </span>
  );
}

// ============================================================
// Component - AuthTypeBadge (FIXED: Consistent with other badges)
// ============================================================
export function AuthTypeBadge({ authType }) {
  const type = authType?.toUpperCase() || 'NONE';
  const config = AUTH_TYPE_STYLES[type] || AUTH_TYPE_STYLES.NONE;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ============================================================
// Component - Compact Version (For dense tables)
// ============================================================
export function CompactStatusBadge({ status }) {
  const style = ENDPOINT_STATUS_STYLES[status] || ENDPOINT_STATUS_STYLES.UNKNOWN;
  
  return (
    <span className={`inline-flex items-center gap-1 ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
    </span>
  );
}

// ============================================================
// Utility - Get status color (for charts, etc.)
// ============================================================
export function getStatusColor(status) {
  const style = ENDPOINT_STATUS_STYLES[status] || ENDPOINT_STATUS_STYLES.UNKNOWN;
  return style.dot.replace('bg-', '');
}

// ============================================================
// Utility - Get auth type label
// ============================================================
export function getAuthTypeLabel(authType) {
  const type = authType?.toUpperCase() || 'NONE';
  return AUTH_TYPE_STYLES[type]?.label || 'None';
}