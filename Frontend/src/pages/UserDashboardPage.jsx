/**
 * UserDashboardPage.jsx — Borrower portfolio view.
 *
 * Sections:
 *  1. Stat cards — Total Borrowed, Active Loans, Health Factor (computed from USER_LOANS)
 *  2. Loan list  — one row per loan with status badge, risk tier badge, and Repay CTA
 *  3. Empty state — shown when the wallet has no loans yet
 *
 * Data is sourced from the mocked USER_LOANS array (Sprint 3).
 * TODO (Sprint 4): replace USER_LOANS with live contract event reads keyed to the
 * connected wallet address. computeUserStats and all rendering code stay the same.
 */

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import RepaymentModal from '../components/loan/RepaymentModal';
import { USER_LOANS } from '../services/mockLoanService';

// ─── Derived stats ─────────────────────────────────────────────────────────────

/**
 * Compute the three user-facing stat card values from a loans array.
 * Pure function — easy to unit-test and Sprint-4-swap-friendly.
 *
 * @param {import('../services/mockLoanService').Loan[]} loans
 */
function computeUserStats(loans) {
  const activeLoans = loans.filter((l) => l.status === 'Active');
  const totalBorrowed = loans.reduce((sum, l) => sum + l.amount, 0);
  // Health factor proxy: mean collateral ratio of active loans (lower = closer to liquidation)
  const avgHealth =
    activeLoans.length > 0
      ? activeLoans.reduce((s, l) => s + l.collateralRatio, 0) / activeLoans.length
      : null;

  return {
    totalBorrowed: parseFloat(totalBorrowed.toFixed(2)),
    activeCount: activeLoans.length,
    healthFactor: avgHealth !== null ? parseFloat(avgHealth.toFixed(2)) : null,
  };
}

const { totalBorrowed, activeCount, healthFactor } = computeUserStats(USER_LOANS);

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

/** Health factor color — mirrors Aave / Compound convention */
function healthColor(hf) {
  if (hf === null) return 'text-[var(--color-text-muted)]';
  if (hf >= 1.6)   return 'text-[var(--color-risk-low)]';
  if (hf >= 1.3)   return 'text-[var(--color-risk-medium)]';
  return 'text-[var(--color-risk-high)]';
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const [modalLoan, setModalLoan] = useState(null);
  const openModal  = useCallback((loan) => setModalLoan(loan), []);
  const closeModal = useCallback(() => setModalLoan(null), []);

  return (
    <>
      <div className="space-y-8 animate-slide-up">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-1">My Dashboard</h1>
            <p className="text-[var(--color-text-muted)] text-sm">
              Overview of your loan portfolio and borrowing history.
            </p>
          </div>
          <Link to="/">
            <Button variant="secondary" size="sm" id="new-loan-btn">
              + New Loan
            </Button>
          </Link>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Borrowed"
            value={`${totalBorrowed} ETH`}
            sub={`across ${USER_LOANS.length} loan${USER_LOANS.length !== 1 ? 's' : ''}`}
            icon="📦"
          />
          <StatCard
            label="Active Loans"
            value={String(activeCount)}
            sub={activeCount === 1 ? 'loan currently open' : 'loans currently open'}
            icon="⚡"
            accent={activeCount > 0}
          />
          <StatCard
            label="Health Factor"
            value={healthFactor !== null ? String(healthFactor) : '—'}
            sub={healthFactor !== null ? 'avg collateral ratio (active)' : 'no active loans'}
            icon="🛡️"
            valueClassName={healthColor(healthFactor)}
          />
        </div>

        {/* ── Loan list or empty state ── */}
        {USER_LOANS.length === 0 ? (
          <EmptyState />
        ) : (
          <LoanList loans={USER_LOANS} onRepay={openModal} />
        )}
      </div>

      {/* ── Repayment modal (portal) ── */}
      <RepaymentModal
        isOpen={modalLoan !== null}
        onClose={closeModal}
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
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Loan History</h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {loans.length} loan{loans.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Loan ID', 'Amount', 'Collateral', 'Interest', 'Due Date', 'Risk Tier', 'Status', ''].map(
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

      {/* ── Mobile card list (< md) ── */}
      <div className="md:hidden space-y-3">
        {loans.map((loan) => (
          <LoanMobileCard key={loan.loanId} loan={loan} onRepay={onRepay} />
        ))}
      </div>
    </Card>
  );
}

function LoanTableRow({ loan, onRepay }) {
  const isActive = loan.status === 'Active';
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
        isActive ? '' : 'opacity-75',
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
        {formatDate(loan.dueDate)}
      </td>
      <td className="py-3.5 pr-4">
        <Badge tier={loan.riskTier} />
      </td>
      <td className="py-3.5 pr-4">
        <Badge status={loan.status} />
      </td>
      <td className="py-3.5">
        {isActive && (
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
  const isActive = loan.status === 'Active';
  const crPct = `${(loan.collateralRatio * 100).toFixed(0)}%`;

  return (
    <div
      className={[
        'rounded-xl p-4 border transition-all',
        isActive
          ? 'border-[var(--color-accent)]/20 bg-[var(--color-surface-elevated)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-elevated)] opacity-75',
      ].join(' ')}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-[var(--color-text-muted)]">{loan.loanId}</span>
        <div className="flex items-center gap-2">
          <Badge tier={loan.riskTier} />
          <Badge status={loan.status} />
        </div>
      </div>

      {/* Stats */}
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
          <p className="text-xs text-[var(--color-text-muted)]">Rate</p>
          <p className="text-sm font-bold">{loan.interestRate}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-muted)]">Due {formatDate(loan.dueDate)}</p>
        {isActive && (
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
        No loans yet
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-6">
        This wallet has no borrowing history. Request your first DeFi loan to get started.
      </p>
      <Link to="/">
        <Button variant="primary" size="md" id="empty-state-new-loan-btn">
          Request a Loan
        </Button>
      </Link>
    </Card>
  );
}
