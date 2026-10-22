import { useMemo, useState } from 'react';
import Card from '../Card';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { predictLoan } from '../../services/loanPredictionService';

const INITIAL_FORM = {
  person_age: '',
  person_gender: '',
  person_education: '',
  person_income: '',
  person_emp_exp: '',
  person_home_ownership: '',
  loan_amnt: '',
  loan_intent: '',
  loan_int_rate: '',
  cb_person_cred_hist_length: '',
  credit_score: '',
  previous_loan_defaults_on_file: '',
};

const fieldClass =
  'mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]';

const labelClass =
  'block text-sm font-medium text-[var(--color-text-primary)]';

function SelectField({ id, label, value, onChange, options, disabled }) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>

      <select
        id={id}
        name={id}
        className={fieldClass}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required
      >
        <option value="">Select {label.toLowerCase()}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 'any',
  hint,
  disabled,
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        name={id}
        className={fieldClass}
        type="number"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        required
        disabled={disabled}
        inputMode="decimal"
      />

      {hint && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function ApplicantDetailsForm({
  onPredictionReceived,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loanPercentIncome = useMemo(() => {
    const amount = Number(form.loan_amnt);
    const income = Number(form.person_income);

    if (!form.loan_amnt || !form.person_income || income <= 0) {
      return '';
    }

    return (amount / income).toFixed(4);
  }, [form.loan_amnt, form.person_income]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const income = Number(form.person_income);
    const amount = Number(form.loan_amnt);
    const percent = amount / income;

    if (income <= 0 || amount <= 0) {
      setError(
        'Annual income and loan amount must be greater than zero.'
      );
      return;
    }

    if (percent > 1) {
      setError(
        'Loan amount divided by annual income must be between 0 and 1 (0%–100%).'
      );
      return;
    }

    if (
      Number(form.person_age) <= 0 ||
      Number(form.person_emp_exp) < 0
    ) {
      setError(
        'Enter a valid age and non-negative employment experience.'
      );
      return;
    }

    if (
      Number(form.credit_score) < 300 ||
      Number(form.credit_score) > 850
    ) {
      setError('Credit score must be between 300 and 850.');
      return;
    }

    if (Number(form.loan_int_rate) <= 0) {
      setError('Loan interest rate must be greater than zero.');
      return;
    }

    const payload = {
      person_age: Number(form.person_age),
      person_gender: form.person_gender,
      person_education: form.person_education,
      person_income: income,
      person_emp_exp: Number(form.person_emp_exp),
      person_home_ownership: form.person_home_ownership,
      loan_amnt: amount,
      loan_intent: form.loan_intent,
      loan_int_rate: Number(form.loan_int_rate),
      loan_percent_income: Number(percent.toFixed(4)),
      cb_person_cred_hist_length: Number(
        form.cb_person_cred_hist_length
      ),
      credit_score: Number(form.credit_score),
      previous_loan_defaults_on_file:
        form.previous_loan_defaults_on_file,
    };

    setIsSubmitting(true);

    try {
      const result = await predictLoan(payload);

      onPredictionReceived?.(result, payload);
    } catch (requestError) {
      setError(
        requestError?.message ||
          'Prediction request failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Applicant Financial Details
          </h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Enter the applicant details used by the AI loan
            approval model. All fields are required.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            id="person_age"
            label="Age"
            value={form.person_age}
            onChange={handleChange}
            min="1"
            max="120"
            step="1"
            disabled={isSubmitting}
          />

          <SelectField
            id="person_gender"
            label="Gender"
            value={form.person_gender}
            onChange={handleChange}
            disabled={isSubmitting}
            options={[
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
            ]}
          />

          <SelectField
            id="person_education"
            label="Education"
            value={form.person_education}
            onChange={handleChange}
            disabled={isSubmitting}
            options={[
              { value: 'High School', label: 'High School' },
              { value: 'Bachelor', label: 'Bachelor' },
              { value: 'Master', label: 'Master' },
              { value: 'Doctorate', label: 'Doctorate' },
            ]}
          />

          <NumberField
            id="person_income"
            label="Annual Income"
            value={form.person_income}
            onChange={handleChange}
            min="0.01"
            disabled={isSubmitting}
            hint="Use the same currency/unit as the loan amount."
          />

          <NumberField
            id="person_emp_exp"
            label="Employment Experience (years)"
            value={form.person_emp_exp}
            onChange={handleChange}
            min="0"
            step="1"
            disabled={isSubmitting}
          />

          <SelectField
            id="person_home_ownership"
            label="Home Ownership"
            value={form.person_home_ownership}
            onChange={handleChange}
            disabled={isSubmitting}
            options={[
              { value: 'OTHER', label: 'Other' },
              { value: 'OWN', label: 'Own' },
              { value: 'RENT', label: 'Rent' },
            ]}
          />

          <NumberField
            id="loan_amnt"
            label="Loan Amount"
            value={form.loan_amnt}
            onChange={handleChange}
            min="0.01"
            disabled={isSubmitting}
            hint="Same unit/currency as annual income."
          />

          <SelectField
            id="loan_intent"
            label="Loan Purpose"
            value={form.loan_intent}
            onChange={handleChange}
            disabled={isSubmitting}
            options={[
              { value: 'EDUCATION', label: 'Education' },
              {
                value: 'HOMEIMPROVEMENT',
                label: 'Home Improvement',
              },
              { value: 'MEDICAL', label: 'Medical' },
              { value: 'PERSONAL', label: 'Personal' },
              { value: 'VENTURE', label: 'Venture' },
            ]}
          />

          <NumberField
            id="loan_int_rate"
            label="Loan Interest Rate (%)"
            value={form.loan_int_rate}
            onChange={handleChange}
            min="0.01"
            disabled={isSubmitting}
            hint="Enter the rate supplied by your lender or project requirements."
          />

          <div>
            <label
              className={labelClass}
              htmlFor="loan_percent_income"
            >
              Loan as % of Annual Income
            </label>

            <input
              id="loan_percent_income"
              className={fieldClass}
              type="number"
              value={loanPercentIncome}
              readOnly
              aria-readonly="true"
            />

            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Calculated as loan amount ÷ annual income.
            </p>
          </div>

          <NumberField
            id="cb_person_cred_hist_length"
            label="Credit History Length (years)"
            value={form.cb_person_cred_hist_length}
            onChange={handleChange}
            min="0"
            disabled={isSubmitting}
          />

          <NumberField
            id="credit_score"
            label="Credit Score"
            value={form.credit_score}
            onChange={handleChange}
            min="300"
            max="850"
            step="1"
            disabled={isSubmitting}
            hint="Valid range: 300–850."
          />

          <SelectField
            id="previous_loan_defaults_on_file"
            label="Previous Loan Defaults"
            value={form.previous_loan_defaults_on_file}
            onChange={handleChange}
            disabled={isSubmitting}
            options={[
              { value: 'Yes', label: 'Yes' },
              { value: 'No', label: 'No' },
            ]}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        <div className="border-t border-[var(--color-border)] pt-5">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Running AI prediction…
              </span>
            ) : (
              'Submit for AI Loan Prediction'
            )}
          </Button>

          <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">
            The prediction is generated by the connected backend model;
            approval is not guaranteed.
          </p>
        </div>
      </form>
    </Card>
  );
}
