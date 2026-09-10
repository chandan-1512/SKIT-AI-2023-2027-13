import { useState, useCallback } from 'react';
import LoanRequestForm from '../components/loan/LoanRequestForm';
import LoanTermsDisplay from '../components/loan/LoanTermsDisplay';

/**
 * LoanRequestPage — Composes the full loan application flow.
 *
 * State machine:
 *   'form'  → user fills in amount and triggers oracle check
 *   'terms' → oracle complete; LoanTermsDisplay is shown
 *
 * Resetting returns to 'form' with clean state.
 */
export default function LoanRequestPage() {
  const [stage, setStage]           = useState('form'); // 'form' | 'terms'
  const [loanAmount, setLoanAmount] = useState(null);
  const [creditScore, setCreditScore] = useState(null);

  /** Called by LoanRequestForm once the mock oracle resolves. */
  const handleScoreReceived = useCallback((amount, score) => {
    setLoanAmount(amount);
    setCreditScore(score);
    setStage('terms');
  }, []);

  /** Reset back to the form so the user can re-run the oracle. */
  const handleReset = useCallback(() => {
    setStage('form');
    setLoanAmount(null);
    setCreditScore(null);
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-1">Request a Loan</h1>
        <p className="text-[var(--color-text-muted)]">
          {stage === 'form'
            ? 'Enter your loan amount and check your on-chain credit score to see personalised terms.'
            : 'Your credit score has been received. Review the terms below before confirming.'}
        </p>
      </div>

      {/* ── Stage: form ── */}
      {stage === 'form' && (
        <LoanRequestForm onScoreReceived={handleScoreReceived} />
      )}

      {/* ── Stage: terms ── */}
      {stage === 'terms' && loanAmount !== null && creditScore !== null && (
        <LoanTermsDisplay
          loanAmount={loanAmount}
          creditScore={creditScore}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
