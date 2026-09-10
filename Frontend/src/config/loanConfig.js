/**
 * loanConfig.js — Configurable bounds for the loan application module.
 *
 * Centralise all tunable constants here so they can be changed in one place.
 * TODO (Sprint 4): These values will be read from the smart contract instead
 * of being hard-coded — replace with on-chain reads via ethers.js.
 */

/** Minimum loan amount in ETH */
export const MIN_LOAN_ETH = 0.1;

/** Maximum loan amount in ETH */
export const MAX_LOAN_ETH = 100;

/**
 * Oracle step labels shown in the StepIndicator during credit-score flow.
 * Indexes map directly to the ORACLE_STEP_* constants below.
 */
export const ORACLE_STEPS = [
  'Requesting score',
  'Awaiting oracle',
  'Score received',
  'Confirm loan terms',
];

export const ORACLE_STEP_REQUESTING = 0;
export const ORACLE_STEP_AWAITING   = 1;
export const ORACLE_STEP_RECEIVED   = 2;
export const ORACLE_STEP_CONFIRM    = 3;

/**
 * Mock oracle step delays (ms).
 * TODO (Sprint 4): Remove entirely — real oracle round-trip replaces this.
 */
export const MOCK_STEP_DELAYS = {
  [ORACLE_STEP_REQUESTING]: 800,  // simulates submitting the request
  [ORACLE_STEP_AWAITING]:   1400, // simulates waiting for the off-chain oracle
  [ORACLE_STEP_RECEIVED]:   600,  // simulates parsing the response
};

/**
 * Derive risk tier from a numeric credit score (300–850).
 * Mirrors the logic that will be returned by the real oracle in Sprint 4.
 *
 * @param {number} score
 * @returns {'low' | 'medium' | 'high'}
 */
export function scoreToTier(score) {
  if (score >= 700) return 'low';
  if (score >= 550) return 'medium';
  return 'high';
}

/**
 * Map risk tier to required collateral ratio and annual interest rate.
 * TODO (Sprint 4): Read from smart contract ABI instead.
 *
 * @param {'low' | 'medium' | 'high'} tier
 * @returns {{ collateralRatio: number, interestRate: number }}
 */
export function tierToTerms(tier) {
  const TERMS = {
    low:    { collateralRatio: 1.2, interestRate: 4.5  },
    medium: { collateralRatio: 1.5, interestRate: 8.0  },
    high:   { collateralRatio: 2.0, interestRate: 14.0 },
  };
  return TERMS[tier] ?? TERMS.high;
}
