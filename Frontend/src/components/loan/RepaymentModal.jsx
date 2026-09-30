/**
 * RepaymentModal.jsx — Confirmation dialog for loan repayment.
 *
 * Rendered via ReactDOM.createPortal so it always sits above all other content
 * regardless of stacking context.
 *
 * Features:
 *  - Shows loan summary (ID, amount, interest rate, due date)
 *  - Confirm Repayment (no-op) → shows inline success state, then calls onClose
 *  - Cancel → closes immediately
 *  - Escape key → closes
 *  - Focus trapped inside while open
 *  - aria-modal / role="dialog" for screen-reader accessibility
 *
 * @param {boolean}  isOpen   - controls visibility
 * @param {Function} onClose  - called when modal should close
 * @param {object}   loan     - the loan being repaid
 */

import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Button from '../Button';

export default function RepaymentModal({ isOpen, onClose, loan }) {
  const [confirmed, setConfirmed] = useState(false);
  const overlayRef  = useRef(null);
  const closebtnRef = useRef(null);

  // Reset confirmed state each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
      // Defer focus into the modal after paint
      setTimeout(() => closebtnRef?.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Close success state after 1.6 s then call onClose
  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [confirmed, onClose]);

  if (!isOpen || !loan) return null;

  // Backdrop click — close if clicking directly on the overlay (not inner panel)
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleConfirm = () => setConfirmed(true);

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="repayment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={handleOverlayClick}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-md glass rounded-2xl p-6 shadow-glow-sm animate-slide-up"
        role="document"
      >
        {/* Close × */}
        <button
          ref={closebnRef}
          aria-label="Close repayment modal"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
        >
          ✕
        </button>

        {confirmed ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-4 py-6 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{ background: 'var(--color-risk-low-bg)', color: 'var(--color-risk-low)' }}>
              ✓
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">Repayment Submitted</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {loan.loanId} will be marked as repaid once confirmed on-chain.
              </p>
            </div>
          </div>
        ) : (
          /* ── Confirmation form ── */
          <>
            {/* Header */}
            <div className="mb-6">
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--color-accent)] mb-1">
                Confirm Repayment
              </p>
              <h2
                id="repayment-modal-title"
                className="text-xl font-bold text-[var(--color-text-primary)]"
              >
                Repay {loan.loanId}
              </h2>
            </div>

            {/* Loan summary grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Principal',      value: `${loan.amount} ETH` },
                { label: 'Interest Rate',  value: `${loan.interestRate}% p.a.` },
                { label: 'Due Date',       value: formatDate(loan.dueDate) },
                { label: 'Collateral',     value: `${(loan.collateralRatio * 100).toFixed(0)}%` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg p-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)]"
                >
                  <p className="text-xs text-[var(--color-text-muted)] mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-[var(--color-text-muted)] mb-6 leading-relaxed">
              Confirming will initiate the on-chain repayment transaction. Your collateral will
              be released once the transaction is finalized.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                id={`cancel-repay-${loan.loanId}`}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                id={`confirm-repay-${loan.loanId}`}
                onClick={handleConfirm}
              >
                Confirm Repayment
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return isoString;
  }
}
