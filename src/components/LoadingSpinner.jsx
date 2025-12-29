/**
 * Loading spinner component with various sizes and styles
 *
 * @param {Object} props
 * @param {('sm'|'md'|'lg'|'xl')} props.size - Spinner size
 * @param {('primary'|'white'|'muted')} props.variant - Color variant
 * @param {string} props.label - Accessible label for screen readers
 * @param {boolean} props.fullScreen - Whether to center in full screen
 */
export default function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  label = 'Loading...',
  fullScreen = false,
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  const variantClasses = {
    primary: 'border-thr-blue-200 border-t-thr-blue-500',
    white: 'border-white/30 border-t-white',
    muted: 'border-slate-200 border-t-slate-500 dark:border-slate-700 dark:border-t-slate-400',
  };

  const spinner = (
    <div
      className={`rounded-full animate-spin ${sizeClasses[size]} ${variantClasses[variant]}`}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{label}</p>
        </div>
      </div>
    );
  }

  return spinner;
}

/**
 * Loading overlay for sections/cards
 */
export function LoadingOverlay({ label = 'Loading...' }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl z-10">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" variant="primary" label={label} />
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonSpinner({ className = '' }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Inline loading indicator
 */
export function InlineLoading({ text = 'Loading' }) {
  return (
    <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
      <ButtonSpinner />
      <span className="text-sm">{text}</span>
    </span>
  );
}
