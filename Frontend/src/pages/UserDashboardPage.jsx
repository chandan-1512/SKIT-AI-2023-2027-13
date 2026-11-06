/**
 * UserDashboardPage.jsx — Borrower portfolio view.
 *
 * Sprint 4 — Task 3: Dashboard Event Indexing
 *   - Replaced USER_LOANS mock with useLoanEvents({ provider, address })
 *   - Shows loading skeleton while events are fetching
 *   - Shows error banner with retry on queryFilter failure
 *   - Shows empty state when wallet has no on-chain applications
 *   - computeUserStats, all rendering sub-components, and RepaymentModal
 *     wiring are unchanged
 *
 * Sections:
 *  1. Stat cards — Total Borrowed, Active Loans, Health Factor
 *  2. Loan list  — one row per loan with status badge, risk tier badge, Repay CTA
 *  3. Empty / loading / error states
 */

import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import RepaymentModal from '../components/loan/RepaymentModal';
import { useWallet } from '../context/WalletContext';
import { useLoanEvents } from '../hooks/useLoanEvents';

// ─── Derived stats ─────────────────────────────────────────────────────────────

/**
 * Compute the three user-facing stat card values from a loans array.
 * Pure function — unchanged from Sprint 3.
 *
 * @param {import('../hooks/useLoanEvents').LoanEvent[]} loans
 */
function computeUserStats(loans) {
  const activeLoans   = loans.filter((l) => l.status === 'Approved');
  const totalBorrowed = loans.reduce((sum, l) => sum + l.amount, 0);
  const avgHealth =
    activeLoans.length > 0
      ? activeLoans.reduce((s, l) => s + l.collateralRatio, 0) / activeLoans.length
      : null;

  return {
    totalBorrowed: parseFloat(totalBorrowed.toFixed(4)),
    activeCount:   activeLoans.length,
    healthFactor:  avgHealth !== null ? parseFloat(avgHealth.toFixed(2)) : null,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function healthColor(hf) {
  if (hf === null) return 'text-[var(--color-text-muted)]';
  if (hf >= 1.6)   return 'text-[var(--color-risk-low)]';
  if (hf >= 1.3)   return 'text-[var(--color-risk-medium)]';
  return 'text-[var(--color-risk-high)]';
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card>
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-24 rounded bg-[var(--color-border)]" />
        <div className="h-7 w-16 rounded bg-[var(--color-border)]" />
        <div className="h-3 w-32 rounded bg-[var(--color-border)]" />
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="h-8 w-48 rounded bg-[var(--color-border)] animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <Card>
        <div className="animate-pulse space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 flex-1 rounded bg-[var(--color-border)]" />
              <div className="h-4 w-20 rounded bg-[var(--color-border)]" />
              <div className="h-4 w-16 rounded bg-[var(--color-border)]" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Error banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/8 text-sm"
    >
      <svg
        className="shrink-0 mt-0.5 text-red-400"
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <div className="flex-1">
        <p className="text-red-300 font-medium">Failed to load loan data</p>
        <p className="text-red-400 text-xs mt-0.5">{message}</p>
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-semibold text-red-400 underline hover:text-red-300"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// ─── Wallet guard ──────────────────────────────────────────────────────────────

function WalletNotConnected() {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
        style={{ background: 'var(--color-accent-muted)' }}
      >
        🔗
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        Wallet not connected
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
        Connect your MetaMask wallet to view your on-chain loan portfolio.
      </p>
    </Card>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const { isConnected, provider, address } = useWallet();
  const { loans, isLoading, error, refetch } = useLoanEvents({
    provider: isConnected ? provider : null,
    address:  isConnected ? address  : null,
  });

  const { totalBorrowed, activeCount, healthFactor } = useMemo(
    () => computeUserStats(loans),
    [loans],
  );

  const [modalLoan, setModalLoan] = useState(null);
  const openModal  = useCallback((loan) => setModalLoan(loan), []);
  const closeModal = useCallback(() => setModalLoan(null), []);

  // Handle repay success — refetch so the status reflects on-chain reality
  const handleRepaySuccess = useCallback(() => {
    closeModal();
    refetch();
  }, [closeModal, refetch]);

  // ── Render guards ──────────────────────────────────────────────────────────

  if (isLoading) return <LoadingSkeleton />;

  if (!isConnected) {
    return (
      <div className="space-y-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1">My Dashboard</h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Overview of your loan portfolio and borrowing history.
          </p>
        </div>
        <WalletNotConnected />
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-8 animate-slide-up">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-1">My Dashboard</h1>
            <p className="text-[var(--color-text-muted)] text-sm">
              Overview of your on-chain loan portfolio.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              title="Refresh loan data"
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-muted)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            <Link to="/">
              <Button variant="secondary" size="sm" id="new-loan-btn">
                + New Loan
              </Button>
            </Link>
          </div>
        </div>

        {/* Error banner */}
        {error && <ErrorBanner message={error} onRetry={refetch} />}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Borrowed"
            value={`${totalBorrowed} ETH`}
            sub={`across ${loans.length} application${loans.length !== 1 ? 's' : ''}`}
            icon="📦"
          />
          <StatCard
            label="Approved Loans"
            value={String(activeCount)}
            sub={activeCount === 1 ? 'loan approved' : 'loans approved'}
            icon="⚡"
            accent={activeCount > 0}
          />
          <StatCard
            label="Health Factor"
            value={healthFactor !== null ? String(healthFactor) : '—'}
            sub={healthFactor !== null ? 'avg collateral ratio (approved)' : 'no approved loans'}
            icon="🛡️"
            valueClassName={healthColor(healthFactor)}
          />
        </div>

        {/* Loan list or empty state */}
        {loans.length === 0 ? (
          <EmptyState />
        ) : (
          <LoanList loans={loans} onRepay={openModal} />
        )}
      </div>

      {/* Repayment modal */}
      <RepaymentModal
        isOpen={modalLoan !== null}
        onClose={closeModal}
        onSuccess={handleRepaySuccess}
        loan={modalLoan}
      />
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent = false, valueClassName = '' }) {
  return (
    <Card hoverable>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          {label}
        </p>
        <span className="text-lg leading-none">{icon}</span>
      </div>
      <p
        className={[
          'text-2xl font-bold',
          accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]',
          valueClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">{sub}</p>
    </Card>
  );
}

function LoanList({ loans, onRepay }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Application History
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {loans.length} application{loans.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['App ID', 'Amount', 'Collateral', 'APR', 'Applied At', 'Risk Tier', 'Status', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left pb-3 pr-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider last:pr-0"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {loans.map((loan) => (
              <LoanTableRow key={loan.loanId} loan={loan} onRepay={onRepay} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loans.map((loan) => (
          <LoanMobileCard key={loan.loanId} loan={loan} onRepay={onRepay} />
        ))}
      </div>
    </Card>
  );
}

function LoanTableRow({ loan, onRepay }) {
  const isApproved = loan.status === 'Approved';
  const crPct = `${(loan.collateralRatio * 100).toFixed(0)}%`;
  const crColor =
    loan.collateralRatio >= 1.6
      ? 'text-[var(--color-risk-low)]'
      : loan.collateralRatio >= 1.3
        ? 'text-[var(--color-risk-medium)]'
        : 'text-[var(--color-risk-high)]';

  return (
    <tr
      className={[
        'hover:bg-[var(--color-surface-elevated)] transition-colors',
        isApproved ? '' : 'opacity-75',
      ].join(' ')}
    >
      <td className="py-3.5 pr-4 font-mono text-xs text-[var(--color-text-secondary)]">
        {loan.loanId}
      </td>
      <td className="py-3.5 pr-4 font-semibold">{loan.amount} ETH</td>
      <td className={['py-3.5 pr-4 font-medium', crColor].join(' ')}>{crPct}</td>
      <td className="py-3.5 pr-4 text-[var(--color-text-secondary)]">
        {loan.interestRate}%
      </td>
      <td className="py-3.5 pr-4 text-[var(--color-text-secondary)]">
        {formatDate(loan.appliedAt)}
      </td>
      <td className="py-3.5 pr-4">
        <Badge tier={loan.riskTier} />
      </td>
      <td className="py-3.5 pr-4">
        <StatusBadge status={loan.status} />
      </td>
      <td className="py-3.5">
        {isApproved && (
          <Button
            variant="secondary"
            size="sm"
            id={`repay-btn-${loan.loanId}`}
            onClick={() => onRepay(loan)}
          >
            Repay
          </Button>
        )}
      </td>
    </tr>
  );
}

function LoanMobileCard({ loan, onRepay }) {
  const isApproved = loan.status === 'Approved';
  const crPct = `${(loan.collateralRatio * 100).toFixed(0)}%`;

  return (
    <div
      className={[
        'rounded-xl p-4 border transition-all',
        isApproved
          ? 'border-[var(--color-accent)]/20 bg-[var(--color-surface-elevated)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] opacity-75',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-[var(--color-text-muted)]">{loan.loanId}</span>
        <div className="flex items-center gap-2">
          <Badge tier={loan.riskTier} />
          <StatusBadge status={loan.status} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Amount</p>
          <p className="text-sm font-bold">{loan.amount} ETH</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Collateral</p>
          <p className="text-sm font-bold">{crPct}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">APR</p>
          <p className="text-sm font-bold">{loan.interestRate}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-muted)]">
          Applied {formatDate(loan.appliedAt)}
        </p>
        {isApproved && (
          <Button
            variant="secondary"
            size="sm"
            id={`repay-mobile-btn-${loan.loanId}`}
            onClick={() => onRepay(loan)}
          >
            Repay
          </Button>
        )}
      </div>
    </div>
  );
}

/** Extends Badge to handle on-chain statuses (Pending / Approved / Rejected). */
function StatusBadge({ status }) {
  const map = {
    Approved: { label: 'Approved', cls: 'text-[var(--color-risk-low)] bg-[var(--color-risk-low-bg)]' },
    Rejected: { label: 'Rejected', cls: 'text-[var(--color-risk-high)] bg-[var(--color-risk-high-bg)]' },
    Pending:  { label: 'Pending',  cls: 'text-amber-400 bg-amber-500/10' },
    // Legacy mock statuses still supported
    Active:      { label: 'Active',      cls: 'text-[var(--color-accent)] bg-[var(--color-accent-muted)]' },
    Repaid:      { label: 'Repaid',      cls: 'text-[var(--color-risk-low)] bg-[var(--color-risk-low-bg)]' },
    Liquidated:  { label: 'Liquidated',  cls: 'text-[var(--color-risk-high)] bg-[var(--color-risk-high-bg)]' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'text-[var(--color-text-muted)] bg-[var(--color-border)]' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
        style={{ background: 'var(--color-accent-muted)' }}
      >
        📭
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        No applications yet
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-6">
        This wallet has no on-chain loan applications. Request your first loan to get started.
      </p>
      <Link to="/">
        <Button variant="primary" size="md" id="empty-state-new-loan-btn">
          Request a Loan
        </Button>
      </Link>
    </Card>
  );
}
