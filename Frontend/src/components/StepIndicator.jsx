/**
 * StepIndicator — horizontal step progress bar.
 *
 * @param {string[]} steps       - array of step label strings
 * @param {number}   currentStep - 0-indexed active step
 */
export default function StepIndicator({ steps = [], currentStep = 0 }) {
  return (
    <div className="w-full" role="list" aria-label="Progress">
      {/* Step nodes + connectors */}
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isDone = index < currentStep;
          const isActive = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none" role="listitem">
              {/* ── Connector line (before each step except the first) ── */}
              {index !== 0 && (
                <div
                  className={[
                    'flex-1 h-0.5 transition-colors duration-500',
                    isDone ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]',
                  ].join(' ')}
                />
              )}

              {/* ── Step circle ── */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                    'border-2 transition-all duration-300 select-none',
                    isDone
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                      : isActive
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)] shadow-glow-sm'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]',
                  ].join(' ')}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isDone ? (
                    /* Checkmark for completed steps */
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step label */}
                <span
                  className={[
                    'text-xs font-medium whitespace-nowrap transition-colors duration-200',
                    isActive
                      ? 'text-[var(--color-accent)]'
                      : isDone
                      ? 'text-[var(--color-text-secondary)]'
                      : 'text-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  {step}
                </span>
              </div>

              {/* ── Connector line (after last step, to fill layout) ── */}
              {!isLast && index === steps.length - 2 && <div className="flex-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
