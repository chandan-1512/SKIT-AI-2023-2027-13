import { useId } from 'react';

/**
 * Input — styled text input with optional label and error state.
 *
 * @param {string}   label       - visible label text
 * @param {string}   placeholder
 * @param {string}   value
 * @param {Function} onChange    - (e) => void
 * @param {string}   error       - error message; if truthy, shows red border + message
 * @param {'text'|'number'|'email'|'password'|'url'} type
 * @param {string}   id          - DOM id (auto-generated via useId if omitted)
 * @param {string}   hint        - helper text below input (shown when no error)
 * @param {boolean}  disabled
 * @param {string}   className
 * @param {React.ReactNode} prefix  - icon/text to show inside input on left
 * @param {React.ReactNode} suffix  - icon/text to show inside input on right
 */
export default function Input({
  label,
  placeholder = '',
  value,
  onChange,
  error,
  type = 'text',
  id: externalId,
  hint,
  disabled = false,
  className = '',
  prefix,
  suffix,
}) {
  const autoId = useId();
  const inputId = externalId ?? autoId;

  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-text-secondary)]"
        >
          {label}
        </label>
      )}

      {/* Input wrapper (for prefix/suffix) */}
      <div className="relative flex items-center">
        {/* Left prefix slot */}
        {prefix && (
          <span className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none">
            {prefix}
          </span>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={[
            'w-full rounded-lg text-sm transition-all duration-150 outline-none',
            'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]',
            'border placeholder:text-[var(--color-text-muted)]',
            'py-2.5',
            prefix ? 'pl-9' : 'pl-3.5',
            suffix ? 'pr-9' : 'pr-3.5',
            error
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
              : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-muted)]',
            disabled && 'opacity-50 cursor-not-allowed',
          ]
            .filter(Boolean)
            .join(' ')}
        />

        {/* Right suffix slot */}
        {suffix && (
          <span className="absolute right-3 text-[var(--color-text-muted)] pointer-events-none">
            {suffix}
          </span>
        )}
      </div>

      {/* Error or hint text */}
      {error ? (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
