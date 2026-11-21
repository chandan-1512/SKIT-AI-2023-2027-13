/**
 * ToastContext.jsx — Application-wide toast / notification system.
 *
 * Sprint 4 — Task 4: Error Handling & End-to-End Documentation
 *
 * Design decisions:
 *   • Rendered via ReactDOM.createPortal into document.body — always above all
 *     z-index stacking contexts (including RepaymentModal at z-50).
 *   • Max 5 toasts visible at once; oldest is auto-dismissed first.
 *   • Each toast auto-dismisses after `duration` ms (default 5 000).
 *   • `role="alert"` / `aria-live="polite"` for screen-reader compatibility.
 *   • Slide-in from bottom-right on enter; slide-out on exit.
 *
 * API (via useToast() hook):
 *   const { toast, dismiss, dismissAll } = useToast();
 *
 *   toast.success('Repayment confirmed!');
 *   toast.error('Transaction failed — insufficient gas.');
 *   toast.warning('Switch to Sepolia to continue.');
 *   toast.info('Wallet connected.');
 *   toast('Custom message', { variant: 'success', duration: 8000, title: 'Done' });
 *
 * Returns the toast id from every call — pass to dismiss(id) for manual removal.
 */

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import ReactDOM from 'react-dom';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_TOASTS   = 5;
const DEFAULT_DURATION_MS = 5_000;

/** @type {'success'|'error'|'warning'|'info'} */
const VARIANTS = ['success', 'error', 'warning', 'info'];

// ─── State machine ─────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   id:        string,
 *   message:   string,
 *   title?:    string,
 *   variant:   'success'|'error'|'warning'|'info',
 *   duration:  number,
 *   exiting:   boolean,
 * }} ToastItem
 */

/** @param {ToastItem[]} state  @param {{ type: string, payload?: * }} action */
function toastsReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const next = [...state, action.payload];
      // Drop oldest if over limit
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    }
    case 'START_EXIT':
      return state.map((t) =>
        t.id === action.id ? { ...t, exiting: true } : t,
      );
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   toasts:     ToastItem[],
 *   toast:      ((msg: string, opts?: Partial<ToastItem>) => string) & {
 *                 success: (msg: string, opts?: Partial<ToastItem>) => string,
 *                 error:   (msg: string, opts?: Partial<ToastItem>) => string,
 *                 warning: (msg: string, opts?: Partial<ToastItem>) => string,
 *                 info:    (msg: string, opts?: Partial<ToastItem>) => string,
 *               },
 *   dismiss:    (id: string) => void,
 *   dismissAll: () => void,
 * }} ToastContextValue
 */

const ToastContext = createContext(/** @type {ToastContextValue|null} */(null));

// ─── Provider ──────────────────────────────────────────────────────────────────

/**
 * ToastProvider — wrap at the root level (inside BrowserRouter is fine).
 * @param {{ children: React.ReactNode }} props
 */
export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastsReducer, []);

  // Map of toastId → timeout handle so we can clear on manual dismiss
  const timersRef = useRef(/** @type {Record<string, ReturnType<typeof setTimeout>>} */({}));

  // Stable ID generator — prefix with 't' so it's a valid key
  let counter = useRef(0);

  const startExit = useCallback((id) => {
    dispatch({ type: 'START_EXIT', id });
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 350); // matches CSS transition
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    startExit(id);
  }, [startExit]);

  const dismissAll = useCallback(() => {
    Object.keys(timersRef.current).forEach((id) => clearTimeout(timersRef.current[id]));
    timersRef.current = {};
    dispatch({ type: 'CLEAR' });
  }, []);

  /**
   * Core enqueue function.
   * @param {string} message
   * @param {Partial<ToastItem>} [opts]
   * @returns {string} toast id
   */
  const addToast = useCallback((message, opts = {}) => {
    const id       = `toast-${++counter.current}`;
    const variant  = VARIANTS.includes(opts.variant) ? opts.variant : 'info';
    const duration = typeof opts.duration === 'number' ? opts.duration : DEFAULT_DURATION_MS;

    dispatch({
      type: 'ADD',
      payload: { id, message, title: opts.title, variant, duration, exiting: false },
    });

    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => startExit(id), duration);
    }
    return id;
  }, [startExit]);

  // Attach convenience shortcuts: toast.success(), toast.error(), etc.
  const toast = useMemo(() => {
    const fn = (msg, opts) => addToast(msg, opts);
    fn.success = (msg, opts) => addToast(msg, { ...opts, variant: 'success' });
    fn.error   = (msg, opts) => addToast(msg, { ...opts, variant: 'error',   duration: opts?.duration ?? 8_000 });
    fn.warning = (msg, opts) => addToast(msg, { ...opts, variant: 'warning' });
    fn.info    = (msg, opts) => addToast(msg, { ...opts, variant: 'info' });
    return fn;
  }, [addToast]);

  const value = useMemo(
    () => ({ toasts, toast, dismiss, dismissAll }),
    [toasts, toast, dismiss, dismissAll],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useToast — access the toast API from any component inside ToastProvider.
 * @returns {ToastContextValue}
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>.');
  }
  return ctx;
}

// ─── Visual components ─────────────────────────────────────────────────────────

const VARIANT_STYLES = {
  success: {
    icon:   '✓',
    border: 'border-green-500/40',
    bg:     'bg-green-500/10',
    iconBg: 'bg-green-500/20 text-green-400',
    title:  'text-green-300',
    bar:    'bg-green-500',
  },
  error: {
    icon:   '✕',
    border: 'border-red-500/40',
    bg:     'bg-red-500/10',
    iconBg: 'bg-red-500/20 text-red-400',
    title:  'text-red-300',
    bar:    'bg-red-500',
  },
  warning: {
    icon:   '⚠',
    border: 'border-amber-500/40',
    bg:     'bg-amber-500/10',
    iconBg: 'bg-amber-500/20 text-amber-400',
    title:  'text-amber-300',
    bar:    'bg-amber-500',
  },
  info: {
    icon:   'ℹ',
    border: 'border-[var(--color-accent)]/40',
    bg:     'bg-[var(--color-accent-muted)]',
    iconBg: 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]',
    title:  'text-[var(--color-accent)]',
    bar:    'bg-[var(--color-accent)]',
  },
};

/** Single toast card. */
function ToastCard({ toast: t, onDismiss }) {
  const s = VARIANT_STYLES[t.variant] ?? VARIANT_STYLES.info;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'relative flex items-start gap-3 w-80 max-w-full rounded-xl border p-4 shadow-lg',
        'backdrop-blur-md transition-all duration-300',
        s.border, s.bg,
        t.exiting
          ? 'opacity-0 translate-x-8 pointer-events-none'
          : 'opacity-100 translate-x-0',
      ].join(' ')}
    >
      {/* Icon */}
      <span
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${s.iconBg}`}
      >
        {s.icon}
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0 pr-4">
        {t.title && (
          <p className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${s.title}`}>
            {t.title}
          </p>
        )}
        <p className="text-sm text-[var(--color-text-primary)] leading-snug break-words">
          {t.message}
        </p>
      </div>

      {/* Dismiss × */}
      <button
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss notification"
        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-xs"
      >
        ✕
      </button>

      {/* Auto-dismiss progress bar */}
      {t.duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-0.5 rounded-b-xl ${s.bar}`}
          style={{
            animation: `toast-shrink ${t.duration}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}

/**
 * ToastContainer — renders all active toasts into a portal.
 * Mount this once inside AppLayout (or anywhere in the tree).
 */
export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return ReactDOM.createPortal(
    <div
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>,
    document.body,
  );
}

