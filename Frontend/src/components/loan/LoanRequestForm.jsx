import { useState, useCallback } from 'react';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import StepIndicator from '../StepIndicator';
import LoadingSpinner from '../LoadingSpinner';
import {
  MIN_LOAN_ETH,
  MAX_LOAN_ETH,
  ORACLE_STEPS,
  ORACLE_STEP_REQUESTING,
  ORACLE_STEP_AWAITING,
  ORACLE_STEP_RECEIVED,
  ORACLE_STEP_CONFIRM,
  MOCK_STEP_DELAYS,
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

// ─── Mock oracle runner ───────────────────────────────────────────────────────

/**
 * Advances through oracle steps with configurable mock delays.
 * TODO (Sprint 4): Replace with a real oracle call (Chainlink / custom node).
 * The onStepChange callback signature stays the same — only this function body changes.
 *
 * @param {(step: number) => void} onStepChange  called as each step begins
 * @param {() => void}             onComplete    called once ORACLE_STEP_CONFIRM is reached
 * @returns {number} a generated mock credit score (300–850)
 */
async function runMockOracle(onStepChange, onComplete) {
  // TODO (Sprint 4): replace setTimeout chain with real oracle subscription
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  onStepChange(ORACLE_STEP_REQUESTING);
  await delay(MOCK_STEP_DELAYS[ORACLE_STEP_REQUESTING]);

  onStepChange(ORACLE_STEP_AWAITING);
  await delay(MOCK_STEP_DELAYS[ORACLE_STEP_AWAITING]);

  onStepChange(ORACLE_STEP_RECEIVED);
  await delay(MOCK_STEP_DELAYS[ORACLE_STEP_RECEIVED]);

  // Generate a deterministic-ish mock score based on current timestamp
  const mockScore = 300 + Math.floor(Math.random() * 551); // 300–850

  onStepChange(ORACLE_STEP_CONFIRM);
  onComplete(mockScore);
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * LoanRequestForm — Step 1 of the loan application flow.
 *
 * Collects the loan amount, runs a mocked oracle credit-score check,
 * and calls onScoreReceived(amount, score) once all oracle steps complete.
 *
 * @param {{ onScoreReceived: (amount: number, score: number) => void }} props
 */
export default function LoanRequestForm({ onScoreReceived }) {
  const [amount, setAmount]           = useState('');
  const [amountError, setAmountError] = useState('');
  const [oracleStep, setOracleStep]   = useState(-1);  // -1 = not started
  const [isRunning, setIsRunning]     = useState(false);

  const isOracleRunning = isRunning && oracleStep < ORACLE_STEP_CONFIRM;

  const handleAmountChange = useCallback((e) => {
    setAmount(e.target.value);
    if (amountError) setAmountError('');
  }, [amountError]);

  const handleCheckScore = useCallback(async () => {
    const error = validateAmount(amount);
    if (error) {
      setAmountError(error);
      return;
    }

    setIsRunning(true);
    setOracleStep(ORACLE_STEP_REQUESTING);

    await runMockOracle(
      (step) => setOracleStep(step),
      (score) => {
        setIsRunning(false);
        onScoreReceived?.(Number(amount), score);
      }
    );
  }, [amount, onScoreReceived]);

  const hasStarted = oracleStep >= 0;

  return (
    <div className="space-y-6">
      {/* Oracle step progress — shown once the user clicks "Check my credit score" */}
      {hasStarted && (
        <div className="animate-fade-in">
          <StepIndicator steps={ORACLE_STEPS} currentStep={oracleStep} />

          {/* Step status caption */}
          <p className="mt-3 text-center text-sm text-[var(--color-text-muted)] flex items-center justify-center gap-2">
            {isOracleRunning && <LoadingSpinner size="sm" />}
            {ORACLE_STEP_CAPTIONS[oracleStep]}
          </p>
        </div>
      )}

      <Card>
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Loan Details
            </h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              Enter the amount you&apos;d like to borrow. We&apos;ll check your on-chain credit
              score before showing personalised terms.
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
            disabled={isOracleRunning || oracleStep === ORACLE_STEP_CONFIRM}
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
            disabled={oracleStep === ORACLE_STEP_CONFIRM}
            onClick={handleCheckScore}
            className="w-full"
          >
            {oracleStep === ORACLE_STEP_CONFIRM ? (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Score received — see terms below
              </span>
            ) : isOracleRunning ? (
              'Running credit check…'
            ) : (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35M11 8v3M11 14h.01" />
                </svg>
                Check my credit score
              </span>
            )}
          </Button>

          {/* Disclaimer */}
          <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">
            {/* TODO (Sprint 4): Replace with real oracle disclaimer */}
            <span className="italic">Mock mode — oracle calls are simulated locally.</span>
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Step captions ────────────────────────────────────────────────────────────

const ORACLE_STEP_CAPTIONS = {
  [ORACLE_STEP_REQUESTING]: 'Submitting your credit score request…',
  [ORACLE_STEP_AWAITING]:   'Waiting for the oracle to respond…',
  [ORACLE_STEP_RECEIVED]:   'Parsing credit score data…',
  [ORACLE_STEP_CONFIRM]:    'Credit score received! Review your loan terms below.',
};
