/**
 * AdminDashboardPage.jsx — Full admin control panel.
 *
 * Sprint 4 — Task 3: Dashboard Event Indexing
 *   - ALL_LOANS mock replaced with useLoanEvents({ provider, address: null })
 *     (null address = query all wallets)
 *   - computeSummaryStats / filterLoans imported from loanUtils.js (pure, unchanged)
 *   - Loading skeleton replaces table while events are fetching
 *   - Error banner with retry on queryFilter failure
 *   - Refresh button in header
 *   - All filter / table / mobile-card / flag-toggle UI unchanged from Sprint 3
 *
 * Features:
 *  • 4 summary stat cards (computed live from on-chain loans)
 *  • Status filter: All / Pending / Approved / Rejected
 *  • Risk-tier filter: All / Low / Medium / High
 *  • Full loan table with explorer links for borrower addresses
 *  • "Flagged for review" toggle per row (local UI state)
 *  • Responsive: table on md+, stacked cards below md
 */

import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useLoanEvents } from '../hooks/useLoanEvents';
import { computeSummaryStats, filterLoans } from '../utils/loanUtils';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['all', 'Approved', 'Pending', 'Rejected'];
const TIER_OPTIONS   = ['all', 'low', 'medium', 'high'];

const STATUS_LABEL = {
  all:      'All Statuses',
  Approved: 'Approved',
  Pending:  'Pending',
  Rejected: 'Rejected',
};
const TIER_LABEL = {
  all:    'All Tiers',
  low:    'Low Risk',
  medium: 'Medium Risk',
  high:   'High Risk',
};

const EXPLORER_BASE = import.meta.env.VITE_EXPLORER_URL ?? 'https://sepolia.etherscan.io';

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      {sub && <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  );
}

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

function CollateralBar({ ratio }) {
  const pct   = Math.min((ratio / 2.5) * 100, 100);
  const color =
    ratio >= 1.8 ? 'var(--color-risk-low)'
    : ratio >= 1.4 ? 'var(--color-risk-medium)'
    :               'var(--color-risk-high)';

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

/** Condensed address with Etherscan link. */
function AddressLink({ address }) {
  if (!address) return <span className="text-[var(--color-text-muted)]">—</span>;
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
  return (
    <a
      href={`${EXPLORER_BASE}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
    >
      {short}
    </a>
  );
}

/** Status pill that handles on-chain statuses. */
function StatusPill({ status }) {
  const map = {
    Approved: 'text-[var(--color-risk-low)] bg-[var(--color-risk-low-bg)]',
    Rejected: 'text-[var(--color-risk-high)] bg-[var(--color-risk-high-bg)]',
    Pending:  'text-amber-400 bg-amber-500/10',
  };
  const cls = map[status] ?? 'text-[var(--color-text-muted)] bg-[var(--color-border)]';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="h-8 w-48 rounded bg-[var(--color-border)] animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="glass rounded-2xl p-5 animate-pulse space-y-3">
            <div className="h-3 w-24 rounded bg-[var(--color-border)]" />
            <div className="h-7 w-16 rounded bg-[var(--color-border)]" />
          </div>
        ))}
      </div>
      <Card>
        <div className="animate-pulse space-y-4 py-4">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-20 rounded bg-[var(--color-border)]" />
              <div className="h-4 w-28 rounded bg-[var(--color-border)]" />
              <div className="h-4 flex-1 rounded bg-[var(--color-border)]" />
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
      <div>
        <p className="text-red-300 font-medium">Failed to load loan data from blockchain</p>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user }                    = useAuth();
  const { isConnected, provider }   = useWallet();

  const { loans, isLoading, error, refetch } = useLoanEvents({
    provider: isConnected ? provider : null,
    address:  null,   // null = all wallets (admin mode)
  });

  // ── Filter state ──────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter,   setTierFilter]   = useState('all');

  // ── Flagged rows (loanId → boolean) ──────────────────────────────────────
  const [flagged, setFlagged] = useState({});
  const toggleFlag = (loanId) =>
    setFlagged((prev) => ({ ...prev, [loanId]: !prev[loanId] }));

  // ── Derived data ──────────────────────────────────────────────────────────
  const stats = useMemo(() => computeSummaryStats(loans), [loans]);
  const visibleLoans = useMemo(
    () => filterLoans(loans, { status: statusFilter, riskTier: tierFilter }),
    [loans, statusFilter, tierFilter],
  );

  // ── Stat card config ──────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Total Applications',
      value: stats.totalIssued,
      sub:   'across all wallets',
      icon:  '📋',
    },
    {
      label: 'Total Value Locked',
      value: `${stats.totalValueLocked.toFixed(4)} ETH`,
      sub:   'approved loans only',
      icon:  '🔒',
      accent: '#22d3ee',
    },
    {
      label: 'Rejection Rate',
      value: `${stats.liquidationRate}%`,
      sub:   'of all applications',
      icon:  '⚡',
      accent: stats.liquidationRate > 20 ? '#f43f5e' : '#f59e0b',
    },
    {
      label: 'Avg Collateral Ratio',
      value: `${(stats.avgCollateralRatio * 100).toFixed(0)}%`,
      sub:   'across all applications',
      icon:  '📊',
      accent: '#a78bfa',
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-8 animate-slide-up">

      {/* Page header */}
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
        <div className="flex items-center gap-2 self-start">
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
          <span
            id="admin-badge"
            className="px-3 py-1 rounded-full text-xs font-bold border border-[var(--color-accent)]/40 text-[var(--color-accent)] bg-[var(--color-accent-muted)]"
          >
            ADMIN
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Filters + table */}
      <Card>
        {/* Table header + filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold">All Applications</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {visibleLoans.length} of {loans.length} applications shown
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

        {/* Table / empty state */}
        {visibleLoans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="text-5xl">{loans.length === 0 ? '📭' : '🔍'}</div>
            <p className="text-[var(--color-text-muted)] text-sm">
              {loans.length === 0
                ? 'No on-chain applications found in the last 50 000 blocks.'
                : 'No applications match the selected filters.'}
            </p>
            {loans.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                id="clear-filters-btn"
                onClick={() => { setStatusFilter('all'); setTierFilter('all'); }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th className="text-left pb-3 pr-4 font-semibold">App ID</th>
                    <th className="text-left pb-3 pr-4 font-semibold">Borrower</th>
                    <th className="text-right pb-3 pr-4 font-semibold">Amount</th>
                    <th className="text-center pb-3 pr-4 font-semibold">Status</th>
                    <th className="text-center pb-3 pr-4 font-semibold">Risk</th>
                    <th className="text-right pb-3 pr-4 font-semibold">Collateral</th>
                    <th className="text-right pb-3 pr-4 font-semibold">APR</th>
                    <th className="text-right pb-3 pr-4 font-semibold">Applied</th>
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
                        <AddressLink address={loan.borrower} />
                      </td>
                      <td className="py-3.5 pr-4 text-right font-semibold">
                        {loan.amount.toFixed(4)} ETH
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        <StatusPill status={loan.status} />
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
                        {new Date(loan.appliedAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
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

            {/* Mobile stacked cards */}
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--color-accent)]">
                      {loan.loanId}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusPill status={loan.status} />
                      <Badge tier={loan.riskTier} />
                      <FlagButton
                        flagged={!!flagged[loan.loanId]}
                        onToggle={() => toggleFlag(loan.loanId)}
                        loanId={`mobile-${loan.loanId}`}
                      />
                    </div>
                  </div>

                  <AddressLink address={loan.borrower} />

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Amount</p>
                      <p className="text-sm font-bold">{loan.amount.toFixed(4)} ETH</p>
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

                  <p className="text-xs text-[var(--color-text-muted)] text-right">
                    Applied:{' '}
                    <span className="text-[var(--color-text-primary)]">
                      {new Date(loan.appliedAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
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
