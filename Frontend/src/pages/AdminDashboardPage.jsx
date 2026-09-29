/**
 * AdminDashboardPage.jsx — Full admin control panel (Sprint 3).
 *
 * Features:
 *  • 4 summary stat cards (computed live from ALL_LOANS via computeSummaryStats)
 *  • Status filter: All / Active / Repaid / Liquidated
 *  • Risk-tier filter: All / Low / Medium / High
 *  • Full loan table with: loanId, borrower, amount, status badge, risk badge,
 *    collateral ratio, interest rate, due date, flag toggle
 *  • "Flagged for review" toggle per row (local UI state, no-op for now)
 *  • Empty state when filters produce no results
 *  • Responsive: table on md+, stacked cards below md
 *
 * Data wiring (Sprint 4):
 *  Replace ALL_LOANS import with a live contract-event read.
 *  computeSummaryStats / filterLoans are pure and need no changes.
 */

import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ALL_LOANS,
  computeSummaryStats,
  filterLoans,
} from '../services/mockLoanService';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS  = ['all', 'Active', 'Repaid', 'Liquidated'];
const TIER_OPTIONS    = ['all', 'low', 'medium', 'high'];

const STATUS_LABEL = { all: 'All Statuses', Active: 'Active', Repaid: 'Repaid', Liquidated: 'Liquidated' };
const TIER_LABEL   = { all: 'All Tiers', low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' };

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Single summary stat card */
function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div
      className="glass rounded-2xl p-5 flex flex-col gap-2 hover:scale-[1.02] transition-transform duration-200"
      style={{ borderColor: accent ? `${accent}40` : undefined }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          {label}
        </p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && (
        <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>
      )}
    </div>
  );
}

/** Filter pill button */
function FilterPill({ label, active, onClick, id }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150',
        active
          ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent-muted)]'
          : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

/** Collateral ratio indicator */
function CollateralBar({ ratio }) {
  const pct = Math.min((ratio / 2.5) * 100, 100);
  const color =
    ratio >= 1.8
      ? 'var(--color-risk-low)'
      : ratio >= 1.4
      ? 'var(--color-risk-medium)'
      : 'var(--color-risk-high)';

  return (
    <div className="flex flex-col items-end gap-1 w-20">
      <span className="text-xs font-mono text-[var(--color-text-primary)]">
        {(ratio * 100).toFixed(0)}%
      </span>
      <div className="w-full h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/** Flag toggle button */
function FlagButton({ flagged, onToggle, loanId }) {
  return (
    <button
      id={`flag-${loanId}`}
      onClick={onToggle}
      title={flagged ? 'Remove flag' : 'Flag for review'}
      className={[
        'p-1.5 rounded-lg transition-all duration-150 text-sm',
        flagged
          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
          : 'bg-transparent text-[var(--color-text-muted)] hover:text-amber-400 hover:bg-amber-500/10',
      ].join(' ')}
      aria-pressed={flagged}
    >
      {flagged ? '🚩' : '⚑'}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter]   = useState('all');
  const [tierFilter,   setTierFilter]     = useState('all');

  // ── Flagged rows (loanId → boolean) — local UI state only ──────────────────
  const [flagged, setFlagged] = useState({});
  const toggleFlag = (loanId) =>
    setFlagged((prev) => ({ ...prev, [loanId]: !prev[loanId] }));

  // ── Derived data ────────────────────────────────────────────────────────────
  const stats = useMemo(() => computeSummaryStats(ALL_LOANS), []);
  const visibleLoans = useMemo(
    () => filterLoans(ALL_LOANS, { status: statusFilter, riskTier: tierFilter }),
    [statusFilter, tierFilter],
  );

  // ── Stat card config ─────────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Total Loans Issued',
      value: stats.totalIssued,
      sub: 'across all wallets',
      icon: '📋',
    },
    {
      label: 'Total Value Locked',
      value: `${stats.totalValueLocked.toFixed(2)} ETH`,
      sub: 'active loans only',
      icon: '🔒',
      accent: '#22d3ee',
    },
    {
      label: 'Liquidation Rate',
      value: `${stats.liquidationRate}%`,
      sub: 'of all issued loans',
      icon: '⚡',
      accent: stats.liquidationRate > 20 ? '#f43f5e' : '#f59e0b',
    },
    {
      label: 'Avg Collateral Ratio',
      value: `${(stats.avgCollateralRatio * 100).toFixed(0)}%`,
      sub: 'across all loans',
      icon: '📊',
      accent: '#a78bfa',
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-slide-up">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1">Admin Dashboard</h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Logged in as{' '}
            <span className="text-[var(--color-text-primary)] font-medium">
              {user?.email}
            </span>
            {' '}· Protocol health, loan oversight, and risk controls.
          </p>
        </div>
        <span
          id="admin-badge"
          className="self-start px-3 py-1 rounded-full text-xs font-bold border border-[var(--color-accent)]/40 text-[var(--color-accent)] bg-[var(--color-accent-muted)]"
        >
          ADMIN
        </span>
      </div>

      {/* ── Summary stat cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Filters + table ───────────────────────────────────────────────── */}
      <Card>
        {/* Table header + filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold">All Loans</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {visibleLoans.length} of {ALL_LOANS.length} loans shown
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {/* Status filter */}
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
              {STATUS_OPTIONS.map((s) => (
                <FilterPill
                  key={s}
                  id={`filter-status-${s}`}
                  label={STATUS_LABEL[s]}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                />
              ))}
            </div>

            {/* Risk-tier filter */}
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by risk tier">
              {TIER_OPTIONS.map((t) => (
                <FilterPill
                  key={t}
                  id={`filter-tier-${t}`}
                  label={TIER_LABEL[t]}
                  active={tierFilter === t}
                  onClick={() => setTierFilter(t)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Desktop table (md+) ────────────────────────────────────────── */}
        {visibleLoans.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="text-5xl">🔍</div>
            <p className="text-[var(--color-text-muted)] text-sm">
              No loans match the selected filters.
            </p>
            <Button
              variant="ghost"
              size="sm"
              id="clear-filters-btn"
              onClick={() => { setStatusFilter('all'); setTierFilter('all'); }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th className="text-left pb-3 pr-4 font-semibold">Loan ID</th>
                    <th className="text-left pb-3 pr-4 font-semibold">Borrower</th>
                    <th className="text-right pb-3 pr-4 font-semibold">Amount</th>
                    <th className="text-center pb-3 pr-4 font-semibold">Status</th>
                    <th className="text-center pb-3 pr-4 font-semibold">Risk</th>
                    <th className="text-right pb-3 pr-4 font-semibold">Collateral</th>
                    <th className="text-right pb-3 pr-4 font-semibold">APR</th>
                    <th className="text-right pb-3 pr-4 font-semibold">Due Date</th>
                    <th className="text-center pb-3 font-semibold">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLoans.map((loan) => (
                    <tr
                      key={loan.loanId}
                      className={[
                        'border-b border-[var(--color-border)]/50 transition-colors duration-150',
                        'hover:bg-[var(--color-surface-elevated)]',
                        flagged[loan.loanId] ? 'bg-amber-500/5' : '',
                      ].join(' ')}
                    >
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-xs font-semibold text-[var(--color-accent)]">
                          {loan.loanId}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">
                          {loan.borrower}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-right font-semibold">
                        {loan.amount.toFixed(2)} ETH
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        <Badge status={loan.status} />
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        <Badge tier={loan.riskTier} />
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex justify-end">
                          <CollateralBar ratio={loan.collateralRatio} />
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-right text-[var(--color-text-muted)]">
                        {loan.interestRate}%
                      </td>
                      <td className="py-3.5 pr-4 text-right text-xs text-[var(--color-text-muted)]">
                        {loan.dueDate}
                      </td>
                      <td className="py-3.5 text-center">
                        <FlagButton
                          flagged={!!flagged[loan.loanId]}
                          onToggle={() => toggleFlag(loan.loanId)}
                          loanId={loan.loanId}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards (< md) */}
            <div className="md:hidden space-y-3">
              {visibleLoans.map((loan) => (
                <div
                  key={loan.loanId}
                  className={[
                    'rounded-xl border border-[var(--color-border)] p-4 space-y-3',
                    'bg-[var(--color-surface-elevated)] transition-colors duration-150',
                    flagged[loan.loanId] ? 'border-amber-500/40 bg-amber-500/5' : '',
                  ].join(' ')}
                >
                  {/* Row 1: ID + badges + flag */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--color-accent)]">
                      {loan.loanId}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge status={loan.status} />
                      <Badge tier={loan.riskTier} />
                      <FlagButton
                        flagged={!!flagged[loan.loanId]}
                        onToggle={() => toggleFlag(loan.loanId)}
                        loanId={`mobile-${loan.loanId}`}
                      />
                    </div>
                  </div>

                  {/* Row 2: Borrower */}
                  <p className="font-mono text-xs text-[var(--color-text-muted)] truncate">
                    {loan.borrower}
                  </p>

                  {/* Row 3: Metrics grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Amount</p>
                      <p className="text-sm font-bold">{loan.amount.toFixed(2)} ETH</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">APR</p>
                      <p className="text-sm font-bold">{loan.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Collateral</p>
                      <p className="text-sm font-bold">
                        {(loan.collateralRatio * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Row 4: Due date */}
                  <p className="text-xs text-[var(--color-text-muted)] text-right">
                    Due: <span className="text-[var(--color-text-primary)]">{loan.dueDate}</span>
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
