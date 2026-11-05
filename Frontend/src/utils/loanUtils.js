/**
 * loanUtils.js — Pure loan data utility functions extracted from mockLoanService.
 *
 * These functions were previously co-located with mock data in mockLoanService.js.
 * Extracting them here makes them usable with live on-chain data without importing
 * the mock arrays.
 *
 * Sprint 4 — Task 3: Dashboard Event Indexing
 *
 * @module loanUtils
 */

/**
 * @typedef {'Pending'|'Approved'|'Rejected'|'Active'|'Repaid'|'Liquidated'} LoanStatus
 * @typedef {'low'|'medium'|'high'} RiskTier
 *
 * @typedef {{
 *   loanId:          string,
 *   borrower?:       string,
 *   amount:          number,
 *   status:          LoanStatus,
 *   collateralRatio: number,
 *   interestRate:    number,
 *   riskTier:        RiskTier,
 * }} Loan
 *
 * @typedef {{
 *   totalIssued:        number,
 *   totalValueLocked:   number,
 *   liquidationRate:    number,
 *   avgCollateralRatio: number,
 * }} AdminSummary
 */

// ─── Active status set ────────────────────────────────────────────────────────

/** Statuses that count as "value locked" (funds currently deployed). */
const ACTIVE_STATUSES = new Set(['Active', 'Approved']);

/** Statuses that count as "rejected / liquidated" for the rejection rate. */
const REJECTED_STATUSES = new Set(['Liquidated', 'Rejected']);

// ─── computeSummaryStats ──────────────────────────────────────────────────────

/**
 * Compute the four admin summary-card values from a loans array.
 * Pure function — no side effects, deterministic, unit-testable.
 *
 * Works with both mock (Active/Repaid/Liquidated) and on-chain
 * (Pending/Approved/Rejected) status strings.
 *
 * @param {Loan[]} loans
 * @returns {AdminSummary}
 */
export function computeSummaryStats(loans) {
  if (!loans || loans.length === 0) {
    return {
      totalIssued:        0,
      totalValueLocked:   0,
      liquidationRate:    0,
      avgCollateralRatio: 0,
    };
  }

  const totalIssued = loans.length;

  const totalValueLocked = loans
    .filter((l) => ACTIVE_STATUSES.has(l.status))
    .reduce((sum, l) => sum + l.amount, 0);

  const rejectedCount  = loans.filter((l) => REJECTED_STATUSES.has(l.status)).length;
  const liquidationRate = parseFloat(((rejectedCount / totalIssued) * 100).toFixed(1));

  const avgCollateralRatio = parseFloat(
    (loans.reduce((sum, l) => sum + l.collateralRatio, 0) / totalIssued).toFixed(2),
  );

  return { totalIssued, totalValueLocked, liquidationRate, avgCollateralRatio };
}

// ─── filterLoans ──────────────────────────────────────────────────────────────

/**
 * Filter a loans array by status and/or risk tier.
 * Passing 'all' (case-insensitive) for either filter is a no-op for that filter.
 * Pure function — no side effects, deterministic, unit-testable.
 *
 * @param {Loan[]}  loans
 * @param {{ status?: string, riskTier?: string }} filters
 * @returns {Loan[]}
 */
export function filterLoans(loans, { status = 'all', riskTier = 'all' } = {}) {
  const normalizedStatus   = status.toLowerCase();
  const normalizedRiskTier = riskTier.toLowerCase();

  return loans.filter((loan) => {
    const statusMatch =
      normalizedStatus === 'all' ||
      loan.status.toLowerCase() === normalizedStatus;
    const tierMatch =
      normalizedRiskTier === 'all' ||
      loan.riskTier.toLowerCase() === normalizedRiskTier;
    return statusMatch && tierMatch;
  });
}
