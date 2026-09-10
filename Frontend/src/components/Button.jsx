import LoadingSpinner from './LoadingSpinner';

/**
 * Button — primary interactive element.
 *
 * @param {'primary'|'secondary'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading  - shows a spinner and disables the button
 * @param {boolean} disabled
 * @param {string}  id       - unique DOM id (required for accessibility & testing)
 * @param {Function} onClick
 * @param {React.ReactNode} children
 * @param {string} className - additional classes
 * @param {'button'|'submit'|'reset'} type
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  id,
  onClick,
  children,
  className = '',
  type = 'button',
}) {
  const isDisabled = disabled || loading;

  /* ── Size styles ── */
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  /* ── Variant styles ── */
  const variantClasses = {
    primary: [
      'text-white font-semibold',
      'shadow-glow-sm hover:shadow-glow',
      'transition-all duration-200',
      isDisabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:brightness-110 active:scale-95',
    ].join(' '),

    secondary: [
      'font-semibold border border-[var(--color-accent)]',
      'text-[var(--color-accent)] bg-[var(--color-accent-muted)]',
      'transition-all duration-200',
      isDisabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:bg-[var(--color-accent)] hover:text-white active:scale-95',
    ].join(' '),

    ghost: [
      'font-medium text-[var(--color-text-secondary)]',
      'bg-transparent border border-[var(--color-border)]',
      'transition-all duration-200',
      isDisabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] active:scale-95',
    ].join(' '),

    danger: [
      'text-white font-semibold',
      'bg-red-600 hover:bg-red-500',
      'transition-all duration-200',
      isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95',
    ].join(' '),
  };

  const baseClasses =
    'inline-flex items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] select-none';

  const primaryBg =
    variant === 'primary'
      ? { background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))' }
      : {};

  return (
    <button
      id={id}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      style={primaryBg}
      className={[baseClasses, sizeClasses[size], variantClasses[variant], className].join(' ')}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}
