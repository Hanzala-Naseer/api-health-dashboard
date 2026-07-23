export function Field({ label, htmlFor, error, hint, required, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

const BASE_INPUT_CLASSES =
  'w-full rounded-lg border bg-surface-container-low px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-ring';

export function TextInput({ error, className = '', ...rest }) {
  return (
    <input
      className={`${BASE_INPUT_CLASSES} ${error ? 'border-danger' : 'border-border'} ${className}`}
      {...rest}
    />
  );
}

export function Select({ error, className = '', children, ...rest }) {
  return (
    <select
      className={`${BASE_INPUT_CLASSES} ${error ? 'border-danger' : 'border-border'} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ error, className = '', ...rest }) {
  return (
    <textarea
      className={`${BASE_INPUT_CLASSES} ${error ? 'border-danger' : 'border-border'} ${className}`}
      {...rest}
    />
  );
}
