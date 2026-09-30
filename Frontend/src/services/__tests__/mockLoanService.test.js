/**
 * mockLoanService.test.js
 *
 * Unit tests for the two pure utility functions exported from mockLoanService:
 *   • computeSummaryStats(loans) → AdminSummary
 *   • filterLoans(loans, filters) → Loan[]
 *
 * These functions have zero React dependencies, so no render / DOM helpers
 * are needed — plain Vitest `describe / it / expect` only.
 *
 * Test counts
 * ───────────
 *   computeSummaryStats  — 9 tests
 *   filterLoans          — 10 tests
 *   Total                — 19 tests
 */

import { describe, it, expect } from 'vitest';
import {
  computeSummaryStats,
  filterLoans,
  ALL_LOANS,
} from '../mockLoanService';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Minimal loan factory — only the fields the pure functions inspect. */
function makeLoan(overrides = {}) {
  return {
    loanId:          'LOAN-TEST',
    borrower:        '0xTest…0000',
    amount:          1.0,
    status:          'Active',
    collateralRatio: 1.5,
    interestRate:    10.0,
    dueDate:         '2026-12-01',
    riskTier:        'medium',
    ...overrides,
  };
}

const ACTIVE_LOW    = makeLoan({ loanId: 'L-A1', status: 'Active',     riskTier: 'low',    amount: 2.0, collateralRatio: 1.80 });
const ACTIVE_MEDIUM = makeLoan({ loanId: 'L-A2', status: 'Active',     riskTier: 'medium', amount: 3.0, collateralRatio: 1.50 });
const ACTIVE_HIGH   = makeLoan({ loanId: 'L-A3', status: 'Active',     riskTier: 'high',   amount: 5.0, collateralRatio: 1.25 });
const REPAID_LOW    = makeLoan({ loanId: 'L-R1', status: 'Repaid',     riskTier: 'low',    amount: 4.0, collateralRatio: 2.00 });
const REPAID_HIGH   = makeLoan({ loanId: 'L-R2', status: 'Repaid',     riskTier: 'high',   amount: 1.5, collateralRatio: 1.40 });
const LIQ_HIGH      = makeLoan({ loanId: 'L-Q1', status: 'Liquidated', riskTier: 'high',   amount: 8.0, collateralRatio: 1.05 });

/** A balanced 6-loan dataset used by most tests. */
const SAMPLE = [ACTIVE_LOW, ACTIVE_MEDIUM, ACTIVE_HIGH, REPAID_LOW, REPAID_HIGH, LIQ_HIGH];

// ─── computeSummaryStats ──────────────────────────────────────────────────────

describe('computeSummaryStats', () => {

  it('returns all-zero summary for an empty array', () => {
    const result = computeSummaryStats([]);
    expect(result).toEqual({
      totalIssued:        0,
      totalValueLocked:   0,
      liquidationRate:    0,
      avgCollateralRatio: 0,
    });
  });

  it('returns all-zero summary for null / undefined input', () => {
    expect(computeSummaryStats(null)).toEqual({
      totalIssued: 0, totalValueLocked: 0, liquidationRate: 0, avgCollateralRatio: 0,
    });
    expect(computeSummaryStats(undefined)).toEqual({
      totalIssued: 0, totalValueLocked: 0, liquidationRate: 0, avgCollateralRatio: 0,
    });
  });

  it('totalIssued equals the number of loans in the array', () => {
    expect(computeSummaryStats(SAMPLE).totalIssued).toBe(6);
    expect(computeSummaryStats([ACTIVE_LOW]).totalIssued).toBe(1);
  });

  it('totalValueLocked sums amounts for Active loans only', () => {
    // Active loans: 2.0 + 3.0 + 5.0 = 10.0
    expect(computeSummaryStats(SAMPLE).totalValueLocked).toBeCloseTo(10.0, 5);
  });

  it('totalValueLocked is 0 when there are no Active loans', () => {
    const noActive = [REPAID_LOW, REPAID_HIGH, LIQ_HIGH];
    expect(computeSummaryStats(noActive).totalValueLocked).toBe(0);
  });

  it('liquidationRate is correct percentage rounded to 1 decimal place', () => {
    // 1 liquidated out of 6 → 16.7%
    expect(computeSummaryStats(SAMPLE).liquidationRate).toBe(16.7);
  });

  it('liquidationRate is 0 when no loans are Liquidated', () => {
    const noLiq = [ACTIVE_LOW, REPAID_LOW];
    expect(computeSummaryStats(noLiq).liquidationRate).toBe(0);
  });

  it('liquidationRate is 100 when all loans are Liquidated', () => {
    const allLiq = [
      makeLoan({ status: 'Liquidated' }),
      makeLoan({ status: 'Liquidated' }),
    ];
    expect(computeSummaryStats(allLiq).liquidationRate).toBe(100);
  });

  it('avgCollateralRatio is the mean across all loans rounded to 2 decimal places', () => {
    // (1.80 + 1.50 + 1.25 + 2.00 + 1.40 + 1.05) / 6 = 9.00 / 6 = 1.50
    expect(computeSummaryStats(SAMPLE).avgCollateralRatio).toBe(1.5);
  });

  it('computes correct stats against the canonical ALL_LOANS fixture', () => {
    const stats = computeSummaryStats(ALL_LOANS);
    // ALL_LOANS has 12 entries (documented in mockLoanService)
    expect(stats.totalIssued).toBe(12);
    // Active loans: amounts 2.5 + 0.8 + 10.0 + 6.0 + 2.0 + 15.0 = 36.3
    expect(stats.totalValueLocked).toBeCloseTo(36.3, 5);
    // 3 Liquidated (LOAN-2218, LOAN-2175, LOAN-2099 from ALL_LOANS... wait, 2099 is in USER_LOANS)
    // Re-checking: LOAN-2218 (Liquidated) + LOAN-2175 (Liquidated) = 2 liquidated in ALL_LOANS
    expect(stats.liquidationRate).toBe(parseFloat(((2 / 12) * 100).toFixed(1)));
    expect(stats.avgCollateralRatio).toBeGreaterThan(0);
  });
});

// ─── filterLoans ──────────────────────────────────────────────────────────────

describe('filterLoans', () => {

  it('returns all loans when called with no filters (defaults to "all"/"all")', () => {
    expect(filterLoans(SAMPLE)).toHaveLength(SAMPLE.length);
  });

  it('returns all loans when both filters are explicitly "all"', () => {
    expect(filterLoans(SAMPLE, { status: 'all', riskTier: 'all' })).toHaveLength(SAMPLE.length);
  });

  it('filters by status: "Active" returns only active loans', () => {
    const result = filterLoans(SAMPLE, { status: 'Active' });
    expect(result).toHaveLength(3);
    result.forEach((l) => expect(l.status).toBe('Active'));
  });

  it('filters by status: "Repaid" returns only repaid loans', () => {
    const result = filterLoans(SAMPLE, { status: 'Repaid' });
    expect(result).toHaveLength(2);
    result.forEach((l) => expect(l.status).toBe('Repaid'));
  });

  it('filters by status: "Liquidated" returns only liquidated loans', () => {
    const result = filterLoans(SAMPLE, { status: 'Liquidated' });
    expect(result).toHaveLength(1);
    expect(result[0].loanId).toBe('L-Q1');
  });

  it('filters by riskTier: "low" returns only low-risk loans', () => {
    const result = filterLoans(SAMPLE, { riskTier: 'low' });
    expect(result).toHaveLength(2);
    result.forEach((l) => expect(l.riskTier).toBe('low'));
  });

  it('filters by riskTier: "high" returns only high-risk loans', () => {
    const result = filterLoans(SAMPLE, { riskTier: 'high' });
    expect(result).toHaveLength(3); // ACTIVE_HIGH, REPAID_HIGH, LIQ_HIGH
    result.forEach((l) => expect(l.riskTier).toBe('high'));
  });

  it('applies status AND riskTier filters simultaneously (intersection)', () => {
    // Active + high → only ACTIVE_HIGH
    const result = filterLoans(SAMPLE, { status: 'Active', riskTier: 'high' });
    expect(result).toHaveLength(1);
    expect(result[0].loanId).toBe('L-A3');
  });

  it('is case-insensitive for the status filter', () => {
    expect(filterLoans(SAMPLE, { status: 'active' })).toHaveLength(3);
    expect(filterLoans(SAMPLE, { status: 'ACTIVE' })).toHaveLength(3);
    expect(filterLoans(SAMPLE, { status: 'Active' })).toHaveLength(3);
  });

  it('is case-insensitive for the riskTier filter', () => {
    expect(filterLoans(SAMPLE, { riskTier: 'LOW' })).toHaveLength(2);
    expect(filterLoans(SAMPLE, { riskTier: 'Low' })).toHaveLength(2);
    expect(filterLoans(SAMPLE, { riskTier: 'low' })).toHaveLength(2);
  });

  it('returns an empty array when no loans match the combined filters', () => {
    // No Repaid + medium loans exist in SAMPLE
    const result = filterLoans(SAMPLE, { status: 'Repaid', riskTier: 'medium' });
    expect(result).toHaveLength(0);
  });

  it('returns an empty array when the input array is empty', () => {
    expect(filterLoans([], { status: 'Active' })).toHaveLength(0);
    expect(filterLoans([], {})).toHaveLength(0);
  });

  it('does not mutate the original loans array', () => {
    const original = [...SAMPLE];
    filterLoans(SAMPLE, { status: 'Active', riskTier: 'low' });
    expect(SAMPLE).toHaveLength(original.length);
    expect(SAMPLE).toEqual(original);
  });
});
