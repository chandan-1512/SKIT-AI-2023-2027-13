/**
 * Badge — color-coded risk tier label.
 *
 * @param {'low'|'medium'|'high'} tier
 * @param {string} className  - additional classes
 */
export default function Badge({ tier = 'medium', className = '' }) {
  const config = {
    low: {
      label: 'Low Risk',
      dot: 'bg-[var(--color-risk-low)]',
      text: 'text-[var(--color-risk-low)]',
      bg: 'bg-[var(--color-risk-low-bg)] border-[var(--color-risk-low)]/30',
    },
    medium: {
      label: 'Medium Risk',
      dot: 'bg-[var(--color-risk-medium)]',
      text: 'text-[var(--color-risk-medium)]',
      bg: 'bg-[var(--color-risk-medium-bg)] border-[var(--color-risk-medium)]/30',
    },
    high: {
      label: 'High Risk',
      dot: 'bg-[var(--color-risk-high)]',
      text: 'text-[var(--color-risk-high)]',
      bg: 'bg-[var(--color-risk-high-bg)] border-[var(--color-risk-high)]/30',
    },
  };

  const { label, dot, text, bg } = config[tier] ?? config.medium;

  return (
    <span
      role="status"
      aria-label={`Risk tier: ${label}`}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-xs font-semibold border',
        bg,
        text,
        className,
      ].join(' ')}
    >
      {/* Animated pulse dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={['animate-ping absolute inline-flex h-full w-full rounded-full opacity-50', dot].join(' ')}
        />
        <span className={['relative inline-flex rounded-full h-2 w-2', dot].join(' ')} />
      </span>
      {label}
    </span>
  );
}
