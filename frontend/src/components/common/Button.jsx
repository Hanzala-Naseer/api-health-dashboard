import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary:
    'bg-transparent border border-border-strong text-text-primary hover:bg-surface-container-high',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-container-high hover:text-text-primary',
  danger: 'bg-danger text-on-primary hover:opacity-90',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />
      )}
      {children}
      {!isLoading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
    </button>
  );
}
