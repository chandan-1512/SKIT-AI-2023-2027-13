/**
 * LoanRequestForm.test.jsx
 *
 * Tests:
 *  1. Submit with no amount → validation error
 *  2. Amount below MIN_LOAN_ETH → validation error
 *  3. Amount above MAX_LOAN_ETH → validation error
 *  4. Valid amount → oracle steps advance through all 4 stages automatically,
 *     then onScoreReceived is called
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoanRequestForm from '../LoanRequestForm';
import {
  MIN_LOAN_ETH,
  MAX_LOAN_ETH,
  ORACLE_STEPS,
} from '../../../config/loanConfig';

// ── Speed up mock oracle delays ────────────────────────────────────────────────
// Override loanConfig so that step delays are 0 ms in tests
vi.mock('../../../config/loanConfig', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    MOCK_STEP_DELAYS: { 0: 0, 1: 0, 2: 0 },
  };
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderForm(overrides = {}) {
  const props = { onScoreReceived: vi.fn(), ...overrides };
  render(<LoanRequestForm {...props} />);
  return props;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('LoanRequestForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows an error when submitted with no amount', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /check my credit score/i }));

    expect(screen.getByText(/loan amount is required/i)).toBeInTheDocument();
  });

  it(`shows an error when amount is below MIN (${MIN_LOAN_ETH} ETH)`, async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/loan amount/i), '0.001');
    await user.click(screen.getByRole('button', { name: /check my credit score/i }));

    expect(screen.getByText(new RegExp(`minimum.*${MIN_LOAN_ETH}`, 'i'))).toBeInTheDocument();
  });

  it(`shows an error when amount exceeds MAX (${MAX_LOAN_ETH} ETH)`, async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/loan amount/i), '999');
    await user.click(screen.getByRole('button', { name: /check my credit score/i }));

    expect(screen.getByText(new RegExp(`maximum.*${MAX_LOAN_ETH}`, 'i'))).toBeInTheDocument();
  });

  it('advances through all 4 oracle stages and calls onScoreReceived', async () => {
    const user = userEvent.setup();
    const { onScoreReceived } = renderForm();

    await user.type(screen.getByLabelText(/loan amount/i), '1');
    await user.click(screen.getByRole('button', { name: /check my credit score/i }));

    // All 4 stage labels should appear in the StepIndicator
    for (const label of ORACLE_STEPS) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }

    // onScoreReceived must be called once all steps complete
    await waitFor(() => expect(onScoreReceived).toHaveBeenCalledOnce());

    // Called with (amount: number, score: number) where score is 300–850
    const [amount, score] = onScoreReceived.mock.calls[0];
    expect(amount).toBe(1);
    expect(score).toBeGreaterThanOrEqual(300);
    expect(score).toBeLessThanOrEqual(850);
  });
});
