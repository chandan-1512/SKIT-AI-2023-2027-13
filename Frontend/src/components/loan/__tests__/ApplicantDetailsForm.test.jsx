
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApplicantDetailsForm from '../ApplicantDetailsForm';
import { predictLoan } from '../../../services/loanPredictionService';

vi.mock('../../../services/loanPredictionService', () => ({
  predictLoan: vi.fn(),
}));

const validForm = {
  Age: '25',
  Gender: 'Male',
  Education: 'Bachelor',
  'Annual Income': '60000',
  'Employment Experience (years)': '3',
  'Home Ownership': 'OWN',
  'Loan Amount': '9000',
  'Loan Purpose': 'EDUCATION',
  'Loan Interest Rate (%)': '10.5',
  'Credit History Length (years)': '4',
  'Credit Score': '720',
  'Previous Loan Defaults': 'No',
};

function fillForm() {
  Object.entries(validForm).forEach(([label, value]) => {
    const field = screen.getByLabelText(label);
    fireEvent.change(field, { target: { value } });
  });
}

describe('ApplicantDetailsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits valid applicant details and receives prediction', async () => {
    const prediction = {
      prediction: 1,
      decision: 'approved',
      probability: 0.95,
      capability_score: 8,
    };

    predictLoan.mockResolvedValue(prediction);

    const onPredictionReceived = vi.fn();

    render(
      <ApplicantDetailsForm
        onPredictionReceived={onPredictionReceived}
      />
    );

    fillForm();

    fireEvent.submit(
      screen.getByRole('button', {
        name: /submit for ai loan prediction/i,
      }).closest('form')
    );

    await waitFor(() => {
      expect(predictLoan).toHaveBeenCalledTimes(1);
      expect(onPredictionReceived).toHaveBeenCalledTimes(1);
    });

    const payload = predictLoan.mock.calls[0][0];

    expect(payload.person_age).toBe(25);
    expect(payload.person_income).toBe(60000);
    expect(payload.loan_amnt).toBe(9000);
    expect(payload.loan_percent_income).toBe(0.15);
    expect(payload.credit_score).toBe(720);
    expect(onPredictionReceived).toHaveBeenCalledWith(
      prediction,
      payload
    );
  });

  it('rejects loan amount greater than annual income', async () => {
    render(<ApplicantDetailsForm />);

    fillForm();

    fireEvent.change(screen.getByLabelText('Loan Amount'), {
      target: { value: '70000' },
    });

    fireEvent.submit(
      screen.getByRole('button', {
        name: /submit for ai loan prediction/i,
      }).closest('form')
    );

    expect(
      await screen.findByRole('alert')
    ).toBeTruthy();

    expect(predictLoan).not.toHaveBeenCalled();
  });

  it('displays backend error when prediction request fails', async () => {
    predictLoan.mockRejectedValue(
      new Error('Backend connection failed')
    );

    render(<ApplicantDetailsForm />);

    fillForm();

    fireEvent.submit(
      screen.getByRole('button', {
        name: /submit for ai loan prediction/i,
      }).closest('form')
    );

    expect(
      await screen.findByText('Backend connection failed')
    ).toBeTruthy();
  });
});
