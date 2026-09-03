import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import StepIndicator from '../components/StepIndicator';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

const STEPS = ['Loan Details', 'Risk Assessment', 'Confirmation', 'Submitted'];

/**
 * LoanRequestPage — placeholder for the loan application flow.
 * Business logic and contract calls land in a later sprint.
 */
export default function LoanRequestPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const simulateNext = () => {
    setLoading(true);
    setTimeout(() => {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-1">Request a Loan</h1>
        <p className="text-[var(--color-text-muted)]">
          Complete the steps below to submit your loan application to the protocol.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Form card */}
      <Card>
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Step {currentStep + 1}: {STEPS[currentStep]}
          </h2>

          <Input
            id="loan-amount"
            label="Loan Amount (ETH)"
            type="number"
            placeholder="0.00"
            hint="Minimum 0.1 ETH — contract limits applied on-chain"
            prefix={<span className="text-xs font-mono">Ξ</span>}
          />

          <Input
            id="loan-duration"
            label="Duration (days)"
            type="number"
            placeholder="30"
            hint="Maximum 365 days"
          />

          <Input
            id="collateral-address"
            label="Collateral Token Address"
            placeholder="0x..."
            hint="ERC-20 token address — validation in Sprint 2"
          />
        </div>

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--color-border)]">
          <Button
            variant="ghost"
            size="md"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
            id="loan-prev-btn"
          >
            ← Back
          </Button>

          <div className="flex items-center gap-3">
            {loading && <LoadingSpinner size="sm" />}
            <Button
              variant="primary"
              size="md"
              loading={loading}
              onClick={simulateNext}
              id="loan-next-btn"
              disabled={currentStep === STEPS.length - 1}
            >
              {currentStep === STEPS.length - 2 ? 'Submit Application' : 'Continue →'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Risk badge demo */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-[var(--color-text-muted)]">Risk tiers:</span>
        <Badge tier="low" />
        <Badge tier="medium" />
        <Badge tier="high" />
      </div>
    </div>
  );
}
