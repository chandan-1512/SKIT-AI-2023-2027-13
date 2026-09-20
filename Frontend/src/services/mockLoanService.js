/**
 * mockLoanService.js — Shared loan mock data and pure utility functions.
 *
 * Exports
 * ───────
 * USER_LOANS  — loans for the currently logged-in borrower (5 items)
 * ALL_LOANS   — all loans across all wallets for admin view (12 items)
 *
 * Pure functions (unit-tested in Task 4)
 * ───────────────────────────────────────
 * computeSummaryStats(loans) → AdminSummary
 * filterLoans(loans, filters) → Loan[]
 *
 * Data shape (matches expected on-chain contract event format for Sprint 4):
 *   { loanId, borrower?, amount, status, collateralRatio, interestRate, dueDate, riskTier }
 *
 * TODO (Sprint 4): Replace USER_LOANS / ALL_LOANS with live contract event reads.
 *   - computeSummaryStats and filterLoans are pure and need no changes.
 *   - Only the data source changes.
 */

// ─── Type Definitions ─────────────────────────────────────────────────────────

/**
 * @typedef {'Active'|'Repaid'|'Liquidated'} LoanStatus
 * @typedef {'low'|'medium'|'high'} RiskTier
 *
 * @typedef {{
 *   loanId:          string,
 *   borrower?:       string,   // wallet address (admin view only)
 *   amount:          number,   // in ETH
 *   status:          LoanStatus,
 *   collateralRatio: number,   // e.g. 1.65 means 165%
 *   interestRate:    number,   // annual %, e.g. 8.5
 *   dueDate:         string,   // ISO date string
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

// ─── User Loans ───────────────────────────────────────────────────────────────

/**
 * Five loans belonging to the currently logged-in borrower.
 * Status distribution: 2 Active, 2 Repaid, 1 Liquidated — enough to exercise
 * every visual state in the User Dashboard.
 *
 * @type {Loan[]}
 */
export const USER_LOANS = [
  {
    loanId:          'LOAN-2301',
    amount:          2.5,
    status:          'Active',
    collateralRatio: 1.72,
    interestRate:    7.5,
    dueDate:         '2026-11-15',
    riskTier:        'low',
  },
  {
    loanId:          'LOAN-2289',
    amount:          0.8,
    status:          'Active',
    collateralRatio: 1.45,
    interestRate:    11.0,
    dueDate:         '2026-10-03',
    riskTier:        'medium',
  },
  {
    loanId:          'LOAN-2201',
    amount:          5.0,
    status:          'Repaid',
    collateralRatio: 2.10,
    interestRate:    6.0,
    dueDate:         '2026-08-20',
    riskTier:        'low',
  },
  {
    loanId:          'LOAN-2178',
    amount:          1.2,
    status:          'Repaid',
    collateralRatio: 1.60,
    interestRate:    9.5,
    dueDate:         '2026-07-30',
    riskTier:        'medium',
  },
  {
    loanId:          'LOAN-2099',
    amount:          8.0,
    status:          'Liquidated',
    collateralRatio: 1.10,
    interestRate:    15.0,
    dueDate:         '2026-06-01',
    riskTier:        'high',
  },
];

// ─── Admin — All Loans ────────────────────────────────────────────────────────

/**
 * Twelve loans across six mock wallet addresses.
 * Used exclusively by the Admin Dashboard (full table + stat cards).
 *
 * @type {Loan[]}
 */
export const ALL_LOANS = [
  // Wallet 1
  {
    loanId:          'LOAN-2301',
    borrower:        '0xAbCd…1234',
    amount:          2.5,
    status:          'Active',
    collateralRatio: 1.72,
    interestRate:    7.5,
    dueDate:         '2026-11-15',
    riskTier:        'low',
  },
  {
    loanId:          'LOAN-2289',
    borrower:        '0xAbCd…1234',
    amount:          0.8,
    status:          'Active',
    collateralRatio: 1.45,
    interestRate:    11.0,
    dueDate:         '2026-10-03',
    riskTier:        'medium',
  },
  // Wallet 2
  {
    loanId:          'LOAN-2265',
    borrower:        '0xDeF0…5678',
    amount:          10.0,
    status:          'Active',
    collateralRatio: 1.30,
    interestRate:    13.5,
    dueDate:         '2026-10-22',
    riskTier:        'high',
  },
  {
    loanId:          'LOAN-2240',
    borrower:        '0xDeF0…5678',
    amount:          3.2,
    status:          'Repaid',
    collateralRatio: 1.85,
    interestRate:    8.0,
    dueDate:         '2026-09-01',
    riskTier:        'low',
  },
  // Wallet 3
  {
    loanId:          'LOAN-2218',
    borrower:        '0x1234…ABcd',
    amount:          1.5,
    status:          'Liquidated',
    collateralRatio: 1.08,
    interestRate:    18.0,
    dueDate:         '2026-08-10',
    riskTier:        'high',
  },
  {
    loanId:          'LOAN-2205',
    borrower:        '0x1234…ABcd',
    amount:          4.0,
    status:          'Repaid',
    collateralRatio: 2.05,
    interestRate:    6.5,
    dueDate:         '2026-07-15',
    riskTier:        'low',
  },
  // Wallet 4
  {
    loanId:          'LOAN-2190',
    borrower:        '0x9876…DCBA',
    amount:          6.0,
    status:          'Active',
    collateralRatio: 1.55,
    interestRate:    10.0,
    dueDate:         '2026-12-01',
    riskTier:        'medium',
  },
  {
    loanId:          'LOAN-2175',
    borrower:        '0x9876…DCBA',
    amount:          0.5,
    status:          'Liquidated',
    collateralRatio: 1.05,
    interestRate:    20.0,
    dueDate:         '2026-06-25',
    riskTier:        'high',
  },
  // Wallet 5
  {
    loanId:          'LOAN-2160',
    borrower:        '0xBEEF…C0DE',
    amount:          7.5,
    status:          'Repaid',
    collateralRatio: 1.95,
    interestRate:    7.0,
    dueDate:         '2026-08-30',
    riskTier:        'low',
  },
  {
    loanId:          'LOAN-2140',
    borrower:        '0xBEEF…C0DE',
    amount:          2.0,
    status:          'Active',
    collateralRatio: 1.48,
    interestRate:    12.0,
    dueDate:         '2026-11-05',
    riskTier:        'medium',
  },
  // Wallet 6
  {
    loanId:          'LOAN-2120',
    borrower:        '0xCAFE…BABE',
    amount:          15.0,
    status:          'Active',
    collateralRatio: 1.25,
    interestRate:    14.0,
    dueDate:         '2026-10-18',
    riskTier:        'high',
  },
  {
    loanId:          'LOAN-2100',
    borrower:        '0xCAFE…BABE',
    amount:          3.8,
    status:          'Repaid',
    collateralRatio: 1.78,
    interestRate:    8.5,
    dueDate:         '2026-09-10',
    riskTier:        'medium',
  },
];

// ─── Pure Utility Functions ───────────────────────────────────────────────────

/**
 * computeSummaryStats
 * -------------------
 * Computes the four admin summary-card values from a loans array.
 * Pure function — no side effects, deterministic, unit-testable.
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

  // Total value locked = sum of amounts for Active loans only
  const totalValueLocked = loans
    .filter((l) => l.status === 'Active')
    .reduce((sum, l) => sum + l.amount, 0);

  // Liquidation rate = (liquidated count / total) × 100, rounded to 1 dp
  const liquidatedCount = loans.filter((l) => l.status === 'Liquidated').length;
  const liquidationRate = parseFloat(((liquidatedCount / totalIssued) * 100).toFixed(1));

  // Average collateral ratio across all loans, rounded to 2 dp
  const avgCollateralRatio = parseFloat(
    (loans.reduce((sum, l) => sum + l.collateralRatio, 0) / totalIssued).toFixed(2),
  );

  return { totalIssued, totalValueLocked, liquidationRate, avgCollateralRatio };
}

/**
 * filterLoans
 * -----------
 * Filters a loans array by status and/or risk tier.
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
      normalizedStatus === 'all' || loan.status.toLowerCase() === normalizedStatus;
    const tierMatch =
      normalizedRiskTier === 'all' || loan.riskTier.toLowerCase() === normalizedRiskTier;
    return statusMatch && tierMatch;
  });
}
