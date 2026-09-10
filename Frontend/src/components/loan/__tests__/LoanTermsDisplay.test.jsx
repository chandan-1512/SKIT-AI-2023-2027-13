/**
 * LoanTermsDisplay.test.jsx
 *
 * Tests:
 *  1. Renders credit score value
 *  2. Renders the correct risk badge tier
 *  3. Renders collateral ratio and interest rate
 *  4. CTA "Deposit collateral & borrow" button is present
 *  5. "Start over" button calls onReset
 *
 * Covers low / medium / high score ranges.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LoanTermsDisplay from '../LoanTermsDisplay';
import { scoreToTier, tierToTerms } from '../../../config/loanConfig';

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderDisplay({ loanAmount = 1, creditScore = 750, onReset = vi.fn() } = {}) {
  render(
    <LoanTermsDisplay
      loanAmount={loanAmount}
      creditScore={creditScore}
      onReset={onReset}
    />
  );
  return { onReset };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('LoanTermsDisplay', () => {
  it('renders the credit score', () => {
    renderDisplay({ creditScore: 720 });
    // Score appears in the gauge as text
    expect(screen.getByLabelText(/credit score: 720/i)).toBeInTheDocument();
  });

  it('renders a "low" risk badge for score ≥ 700', () => {
    renderDisplay({ creditScore: 750 });
    // Badge has role="status" and aria-label="Risk tier: Low Risk"
    expect(screen.getByRole('status', { name: /low risk/i })).toBeInTheDocument();
  });

  it('renders a "medium" risk badge for score 550–699', () => {
    renderDisplay({ creditScore: 620 });
    expect(screen.getByRole('status', { name: /medium risk/i })).toBeInTheDocument();
  });

  it('renders a "high" risk badge for score < 550', () => {
    renderDisplay({ creditScore: 400 });
    expect(screen.getByRole('status', { name: /high risk/i })).toBeInTheDocument();
  });

  it('renders collateral ratio for the score tier', () => {
    const score = 750;
    const tier = scoreToTier(score);
    const { collateralRatio } = tierToTerms(tier);

    renderDisplay({ creditScore: score, loanAmount: 2 });

    // The ratio appears in both the stat row and the callout text — use getAllByText
    const matches = screen.getAllByText(new RegExp(`${collateralRatio}×`));
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders annual interest rate for the score tier', () => {
    const score = 620;
    const tier = scoreToTier(score);
    const { interestRate } = tierToTerms(tier);

    renderDisplay({ creditScore: score });

    expect(screen.getByText(new RegExp(`${interestRate}%`))).toBeInTheDocument();
  });

  it('renders the "Deposit collateral & borrow" CTA button', () => {
    renderDisplay();
    expect(
      screen.getByRole('button', { name: /deposit collateral.*borrow/i })
    ).toBeInTheDocument();
  });

  it('calls onReset when "Start over" is clicked', async () => {
    const user = userEvent.setup();
    const { onReset } = renderDisplay();

    await user.click(screen.getByRole('button', { name: /start over/i }));

    expect(onReset).toHaveBeenCalledOnce();
  });
});
