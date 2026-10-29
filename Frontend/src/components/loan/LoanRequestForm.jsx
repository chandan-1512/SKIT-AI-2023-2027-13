/**
 * LoanRequestForm.jsx — Step 1 of the loan application flow.
 *
 * Sprint 4 — Task 2: Contract Integration
 *   - runMockOracle() replaced with useContractOracle() hook
 *   - Wallet guards: blocks submit if not connected / wrong network
 *   - Shows transaction hash with Sepolia Etherscan link after submission
 *   - Oracle timeout and rejection errors shown inline
 *   - StepIndicator driven by real on-chain events (not setTimeout)
 *
 * Calls onScoreReceived(amount, oracleResult) once oracle confirms.
 * oracleResult = { appId: BigInt, status: number, decision: string }
 *
 * @param {{ onScoreReceived: (amount: number, result: OracleResult) => void }} props
 */

import { useState, useCallback } from 'react';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import StepIndicator from '../StepIndicator';
import LoadingSpinner from '../LoadingSpinner';
import { useWallet } from '../../context/WalletContext';
import { useContractOracle } from '../../hooks/useContractOracle';
import {
  MIN_LOAN_ETH,
  MAX_LOAN_ETH,
  ORACLE_STEPS,
  ORACLE_STEP_REQUESTING,
  ORACLE_STEP_AWAITING,
  ORACLE_STEP_CONFIRM,
} from '../../config/loanConfig';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateAmount(raw) {
  if (!raw && raw !== 0) return 'Loan amount is required.';
  const num = Number(raw);
  if (isNaN(num) || num <= 0) return 'Please enter a positive number.';
  if (num < MIN_LOAN_ETH) return `Minimum loan amount is ${MIN_LOAN_ETH} ETH.`;
  if (num > MAX_LOAN_ETH) return `Maximum loan amount is ${MAX_LOAN_ETH} ETH.`;
  return null;
}

// ─── Explorer link helper ─────────────────────────────────────────────────────

const EXPLORER_BASE = import.meta.env.VITE_EXPLORER_URL ?? 'https://sepolia.etherscan.io';

function TxLink({ hash }) {
  if (!hash) return null;
  return (
    <a
      href={`${EXPLORER_BASE}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline font-mono"
    >
      {hash.slice(0, 10)}…{hash.slice(-6)}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

// ─── Wallet guard banner ──────────────────────────────────────────────────────

function WalletGuard({ isConnected, isCorrectNetwork, onSwitch }) {
  if (isConnected && isCorrectNetwork) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/8 text-sm"
    >
      <svg
        className="shrink-0 mt-0.5 text-amber-400"
        width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div className="flex-1">
        {!isConnected ? (
          <p className="text-amber-300">
            <strong className="font-semibold">Wallet not connected.</strong>{' '}
            Click <em>Connect Wallet</em> in the navbar to continue.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-amber-300">
              <strong className="font-semibold">Wrong network.</strong>{' '}
              Switch to Sepolia testnet to submit a loan application.
            </p>
            <button
              onClick={onSwitch}
              className="text-xs font-semibold text-amber-400 underline hover:text-amber-300"
            >
              Switch to Sepolia →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoanRequestForm({ onScoreReceived }) {
  const { isConnected, isCorrectNetwork, switchToSepolia } = useWallet();
  const {
    oracleStep,
    isRunning,
    error: oracleError,
    txHash,
    runOracle,
    reset: resetOracle,
  } = useContractOracle();

  const [amount,      setAmount]      = useState('');
  const [amountError, setAmountError] = useState('');

  const isOracleRunning = isRunning && oracleStep < ORACLE_STEP_CONFIRM;
  const hasStarted      = oracleStep >= 0;
  const isBlocked       = !isConnected || !isCorrectNetwork;

  const handleAmountChange = useCallback((e) => {
    setAmount(e.target.value);
    if (amountError) setAmountError('');
  }, [amountError]);

  const handleCheckScore = useCallback(async () => {
    const validationError = validateAmount(amount);
    if (validationError) {
      setAmountError(validationError);
      return;
    }

    const result = await runOracle(Number(amount));

    if (result) {
      // Pass amount + the full oracle result up to LoanRequestPage
      onScoreReceived?.(Number(amount), result);
    }
  }, [amount, runOracle, onScoreReceived]);

  const handleReset = useCallback(() => {
    resetOracle();
    setAmount('');
    setAmountError('');
  }, [resetOracle]);

  return (
    <div className="space-y-6">
      {/* Wallet guard */}
      <WalletGuard
        isConnected={isConnected}
        isCorrectNetwork={isCorrectNetwork}
        onSwitch={switchToSepolia}
      />

      {/* Oracle step progress */}
      {hasStarted && (
        <div className="animate-fade-in">
          <StepIndicator steps={ORACLE_STEPS} currentStep={oracleStep} />

          <div className="mt-3 text-center space-y-1">
            <p className="text-sm text-[var(--color-text-muted)] flex items-center justify-center gap-2">
              {isOracleRunning && <LoadingSpinner size="sm" />}
              {ORACLE_STEP_CAPTIONS[oracleStep]}
            </p>

            {/* Transaction hash link */}
            {txHash && oracleStep === ORACLE_STEP_AWAITING && (
              <p className="text-xs text-[var(--color-text-muted)]">
                Tx submitted: <TxLink hash={txHash} />
              </p>
            )}

            {/* Awaiting note */}
            {oracleStep === ORACLE_STEP_AWAITING && (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                Oracle response may take 15–90 seconds on Sepolia…
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error banner */}
      {oracleError && (
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
            <p className="text-red-300">{oracleError}</p>
            <button
              onClick={handleReset}
              className="mt-1 text-xs font-semibold text-red-400 underline hover:text-red-300"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <Card>
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Loan Details
            </h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              Enter the amount you&apos;d like to borrow. We&apos;ll submit a request to the
              on-chain registry and wait for the oracle&apos;s credit decision.
            </p>
          </div>

          <Input
            id="loan-amount"
            name="loanAmount"
            label="Loan Amount (ETH)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={handleAmountChange}
            error={amountError}
            hint={`Range: ${MIN_LOAN_ETH} – ${MAX_LOAN_ETH} ETH`}
            prefix={<span className="text-xs font-mono font-semibold">Ξ</span>}
            disabled={isOracleRunning || oracleStep === ORACLE_STEP_CONFIRM || isBlocked}
          />

          {/* Bounds info row */}
          <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] inline-block" />
              Min: {MIN_LOAN_ETH} ETH
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] inline-block" />
              Max: {MAX_LOAN_ETH} ETH
            </span>
          </div>
        </div>

        {/* Action footer */}
        <div className="mt-6 pt-5 border-t border-[var(--color-border)]">
          <Button
            id="check-score-btn"
            variant="primary"
            size="lg"
            loading={isOracleRunning}
            disabled={oracleStep === ORACLE_STEP_CONFIRM || isBlocked}
            onClick={handleCheckScore}
            className="w-full"
          >
            {oracleStep === ORACLE_STEP_CONFIRM ? (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Decision received — see terms below
              </span>
            ) : isOracleRunning ? (
              ORACLE_STEP_CAPTIONS_SHORT[oracleStep] ?? 'Processing…'
            ) : (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Submit to blockchain
              </span>
            )}
          </Button>

          {/* Reset link when confirmed */}
          {oracleStep === ORACLE_STEP_CONFIRM && (
            <button
              onClick={handleReset}
              className="mt-3 w-full text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Start a new application ↩
            </button>
          )}

          {/* Confirmed tx explorer link */}
          {txHash && oracleStep === ORACLE_STEP_CONFIRM && (
            <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
              Transaction: <TxLink hash={txHash} />
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Step captions ────────────────────────────────────────────────────────────

const ORACLE_STEP_CAPTIONS = {
  [ORACLE_STEP_REQUESTING]: 'Submitting application to the blockchain…',
  [ORACLE_STEP_AWAITING]:   'Waiting for the oracle to respond…',
  2:                         'Parsing oracle decision…',
  [ORACLE_STEP_CONFIRM]:    'Decision received! Review your loan terms below.',
};

const ORACLE_STEP_CAPTIONS_SHORT = {
  [ORACLE_STEP_REQUESTING]: 'Submitting…',
  [ORACLE_STEP_AWAITING]:   'Awaiting oracle…',
  2:                         'Parsing…',
};
