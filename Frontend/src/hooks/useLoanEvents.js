/**
 * useLoanEvents.js — Fetches on-chain loan applications via ethers queryFilter.
 *
 * Data source: LoanDecisionRegistry events
 *   • LoanApplicationSubmitted  → one entry per application
 *   • getLoanApplicationStatus  → current status (Pending / Approved / Rejected)
 *   • decisionExists            → whether a decision has been recorded
 *
 * Usage:
 *   // User dashboard — only current wallet's applications
 *   const { loans, isLoading, error, refetch } = useLoanEvents({ provider, address });
 *
 *   // Admin dashboard — all applications from all wallets
 *   const { loans, isLoading, error, refetch } = useLoanEvents({ provider, address: null });
 *
 * Returned loan shape (compatible with existing dashboard rendering code):
 * {
 *   loanId:          string,          // "APP-{n}"
 *   appId:           bigint,          // raw uint256
 *   borrower:        string,          // checksummed address (admin view)
 *   amount:          number,          // ETH (formatted from wei)
 *   status:          'Pending'|'Approved'|'Rejected',
 *   hasDecision:     boolean,
 *   appliedAt:       string,          // ISO date string
 *   riskTier:        'low'|'medium'|'high',   // derived from amount
 *   collateralRatio: number,          // derived from riskTier
 *   interestRate:    number,          // derived from riskTier
 *   dueDate:         string,          // estimated (appliedAt + 90 days)
 * }
 *
 * Sprint 4 — Task 3: Dashboard Event Indexing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatEther } from 'ethers';
import { getReadContract, LOAN_STATUS_LABEL } from '../services/contractService';
import { scoreToTier, tierToTerms } from '../config/loanConfig';

// How far back to search for events (in blocks).
// Sepolia mines ~12 s/block; 50 000 blocks ≈ 7 days
const BLOCK_LOOKBACK = 50_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive a synthetic risk tier from loan amount (ETH):
 *   < 1 ETH   → low
 *   1–10 ETH  → medium
 *   > 10 ETH  → high
 *
 * This maps amount into the same tier system used by the UI without an
 * on-chain credit score for historical events.
 *
 * @param {number} amountEth
 * @returns {'low'|'medium'|'high'}
 */
function amountToTier(amountEth) {
  if (amountEth < 1)   return 'low';
  if (amountEth <= 10) return 'medium';
  return 'high';
}

/**
 * Estimate a due date as appliedAt + 90 days (ISO string).
 * @param {string} appliedAtIso
 * @returns {string}
 */
function estimateDueDate(appliedAtIso) {
  try {
    const d = new Date(appliedAtIso);
    d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
  } catch {
    return appliedAtIso;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   loanId:          string,
 *   appId:           bigint,
 *   borrower:        string,
 *   amount:          number,
 *   status:          'Pending' | 'Approved' | 'Rejected',
 *   hasDecision:     boolean,
 *   appliedAt:       string,
 *   riskTier:        'low' | 'medium' | 'high',
 *   collateralRatio: number,
 *   interestRate:    number,
 *   dueDate:         string,
 * }} LoanEvent
 */

/**
 * @param {{
 *   provider: import('ethers').BrowserProvider | null,
 *   address:  string | null,   // null = all wallets (admin mode)
 * }} params
 *
 * @returns {{
 *   loans:     LoanEvent[],
 *   isLoading: boolean,
 *   error:     string | null,
 *   refetch:   () => void,
 * }}
 */
export function useLoanEvents({ provider, address }) {
  const [loans,     setLoans]     = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState(null);
  const [tick,      setTick]      = useState(0);       // bump to trigger refetch

  // Track in-flight fetches so unmounting/address-change doesn't cause stale writes
  const abortRef = useRef(false);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!provider) {
      setLoans([]);
      return;
    }

    abortRef.current = false;
    setIsLoading(true);
    setError(null);

    async function fetchEvents() {
      const contract = getReadContract(provider);

      // Determine from-block: last BLOCK_LOOKBACK or block 0 if chain is short
      let fromBlock = 0;
      try {
        const latest = await provider.getBlockNumber();
        fromBlock = Math.max(0, latest - BLOCK_LOOKBACK);
      } catch {
        fromBlock = 0;
      }

      // Build event filter — address-specific for user, null for admin
      const submitFilter = address
        ? contract.filters.LoanApplicationSubmitted(null, address)
        : contract.filters.LoanApplicationSubmitted();

      const submitLogs = await contract.queryFilter(submitFilter, fromBlock, 'latest');

      if (abortRef.current) return;

      // For each application, fetch current status + decision flag in parallel
      const settled = await Promise.allSettled(
        submitLogs.map(async (log) => {
          const { applicationId, applicant, loanAmount, timestamp } = log.args;

          const [statusRaw, hasDecision] = await Promise.all([
            contract.getLoanApplicationStatus(applicationId),
            contract.decisionExists(applicationId),
          ]);

          const statusNum = Number(statusRaw);
          const statusStr = LOAN_STATUS_LABEL[statusNum] ?? 'Pending';

          // Convert wei → ETH, derive tier, compute terms
          const amountEth    = parseFloat(parseFloat(formatEther(loanAmount)).toFixed(6));
          const tier         = amountToTier(amountEth);
          const { collateralRatio, interestRate } = tierToTerms(tier);

          const appliedAt = new Date(Number(timestamp) * 1000).toISOString();

          return /** @type {LoanEvent} */ ({
            loanId:          `APP-${applicationId.toString()}`,
            appId:           applicationId,
            borrower:        applicant,
            amount:          amountEth,
            status:          statusStr,
            hasDecision:     Boolean(hasDecision),
            appliedAt,
            riskTier:        tier,
            collateralRatio,
            interestRate,
            dueDate:         estimateDueDate(appliedAt),
          });
        })
      );

      if (abortRef.current) return;

      // Keep only fulfilled results; log any individual failures
      const result = [];
      for (const s of settled) {
        if (s.status === 'fulfilled') {
          result.push(s.value);
        } else {
          console.warn('[useLoanEvents] skipping one application due to error:', s.reason);
        }
      }

      // Sort newest first
      result.sort((a, b) => b.appId - a.appId);

      setLoans(result);
    }

    fetchEvents()
      .catch((err) => {
        if (!abortRef.current) {
          console.error('[useLoanEvents] queryFilter error:', err);
          setError(err?.message ?? 'Failed to load loan data from the blockchain.');
        }
      })
      .finally(() => {
        if (!abortRef.current) setIsLoading(false);
      });

    return () => {
      abortRef.current = true;
    };
  // Re-run when provider, address, or manual refetch tick changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, address, tick]);

  return { loans, isLoading, error, refetch };
}
