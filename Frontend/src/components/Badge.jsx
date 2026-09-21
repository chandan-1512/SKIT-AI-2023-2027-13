/**
 * Badge — color-coded label component.
 *
 * Two usage modes (mutually exclusive — provide one or the other):
 *
 *   1. Risk Tier:  <Badge tier="low" />  |  "medium"  |  "high"
 *   2. Loan Status: <Badge status="Active" />  |  "Repaid"  |  "Liquidated"
 *
 * @param {'low'|'medium'|'high'}               tier     - risk tier mode
 * @param {'Active'|'Repaid'|'Liquidated'}       status   - loan status mode
 * @param {string}                               className - additional classes
 */
export default function Badge({ tier, status, className = '' }) {
  // ── Loan status config ───────────────────────────────────────────────────────
  const statusConfig = {
    Active: {
      label: 'Active',
      dot:   'bg-[var(--color-risk-low)]',
      text:  'text-[var(--color-risk-low)]',
      bg:    'bg-[var(--color-risk-low-bg)] border-[var(--color-risk-low)]/30',
    },
    Repaid: {
      label: 'Repaid',
      dot:   'bg-[var(--color-text-muted)]',
      text:  'text-[var(--color-text-muted)]',
      bg:    'bg-[var(--color-surface-elevated)] border-[var(--color-border)]',
    },
    Liquidated: {
      label: 'Liquidated',
      dot:   'bg-[var(--color-risk-high)]',
      text:  'text-[var(--color-risk-high)]',
      bg:    'bg-[var(--color-risk-high-bg)] border-[var(--color-risk-high)]/30',
    },
  };

  // ── Risk tier config (original, unchanged) ───────────────────────────────────
  const tierConfig = {
    low: {
      label: 'Low Risk',
      dot:   'bg-[var(--color-risk-low)]',
      text:  'text-[var(--color-risk-low)]',
      bg:    'bg-[var(--color-risk-low-bg)] border-[var(--color-risk-low)]/30',
    },
    medium: {
      label: 'Medium Risk',
      dot:   'bg-[var(--color-risk-medium)]',
      text:  'text-[var(--color-risk-medium)]',
      bg:    'bg-[var(--color-risk-medium-bg)] border-[var(--color-risk-medium)]/30',
    },
    high: {
      label: 'High Risk',
      dot:   'bg-[var(--color-risk-high)]',
      text:  'text-[var(--color-risk-high)]',
      bg:    'bg-[var(--color-risk-high-bg)] border-[var(--color-risk-high)]/30',
    },
  };

  // Resolve which config to use — status takes precedence if both are supplied
  const config = status
    ? (statusConfig[status] ?? statusConfig.Active)
    : (tierConfig[tier]   ?? tierConfig.medium);

  const { label, dot, text, bg } = config;

  return (
    <span
      role="status"
      aria-label={status ? `Loan status: ${label}` : `Risk tier: ${label}`}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-xs font-semibold border',
        bg,
        text,
        className,
      ].join(' ')}
    >
      {/* Animated pulse dot — static for Repaid (no pending action) */}
      <span className="relative flex h-2 w-2 shrink-0">
        {status !== 'Repaid' && (
          <span
            className={[
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-50',
              dot,
            ].join(' ')}
          />
        )}
        <span className={['relative inline-flex rounded-full h-2 w-2', dot].join(' ')} />
      </span>
      {label}
    </span>
  );
}
