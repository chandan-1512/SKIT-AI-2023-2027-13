import Card from '../Card';
import Button from '../Button';
import Badge from '../Badge';
import { scoreToTier, tierToTerms } from '../../config/loanConfig';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatRow({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--color-text-primary)] text-right">
        {value}
        {sub && (
          <span className="block text-xs font-normal text-[var(--color-text-muted)]">{sub}</span>
        )}
      </span>
    </div>
  );
}

function ScoreGauge({ score }) {
  // Map 300–850 → 0–100%
  const pct = ((score - 300) / 550) * 100;
  const tier = scoreToTier(score);
  const barColor =
    tier === 'low'
      ? 'var(--color-risk-low)'
      : tier === 'medium'
      ? 'var(--color-risk-medium)'
      : 'var(--color-risk-high)';

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">Credit Score</span>
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color: barColor }}
          aria-label={`Credit score: ${score}`}
        >
          {score}
        </span>
      </div>

      {/* Track */}
      <div
        className="relative w-full h-2.5 rounded-full overflow-hidden"
        style={{ background: 'var(--color-surface-elevated)' }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={300}
        aria-valuemax={850}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>

      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>300</span>
        <span>850</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * LoanTermsDisplay — shown after the (mocked) oracle returns a credit score.
 *
 * Displays:
 *  • Credit score with a visual gauge
 *  • Risk tier badge
 *  • Required collateral ratio
 *  • Annual interest rate
 *  • Loan amount requested
 *  • "Deposit collateral & borrow" CTA (no-op in Sprint 2)
 *
 * TODO (Sprint 4): The "Deposit collateral & borrow" button will call the
 * smart contract's `depositCollateralAndBorrow(amount, collateral)` function
 * via ethers.js. Replace the onClick no-op with that call.
 *
 * @param {{
 *   loanAmount: number,
 *   creditScore: number,
 *   onReset: () => void,
 * }} props
 */
export default function LoanTermsDisplay({ loanAmount, creditScore, onReset }) {
  const tier = scoreToTier(creditScore);
  const { collateralRatio, interestRate } = tierToTerms(tier);
  const requiredCollateral = (loanAmount * collateralRatio).toFixed(4);

  function handleConfirm() {
    // TODO (Sprint 4): call smart contract depositCollateralAndBorrow()
    // eslint-disable-next-line no-console
    console.info('[Sprint 4 TODO] depositCollateralAndBorrow() goes here.');
  }

  return (
    <div className="space-y-4 animate-slide-up" role="region" aria-label="Loan Terms">
      {/* ── Score + tier card ── */}
      <Card>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                Your Credit Profile
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Based on your on-chain activity — refreshed each request.
              </p>
            </div>
            <Badge tier={tier} />
          </div>

          <ScoreGauge score={creditScore} />
        </div>
      </Card>

      {/* ── Loan terms card ── */}
      <Card>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
            Loan Terms
          </h3>

          <StatRow
            label="Loan amount"
            value={`${loanAmount} ETH`}
            sub="Ξ requested"
          />
          <StatRow
            label="Collateral ratio"
            value={`${collateralRatio}×`}
            sub={`You must deposit ${requiredCollateral} ETH`}
          />
          <StatRow
            label="Annual interest rate"
            value={`${interestRate}% APR`}
            sub={tier === 'low' ? 'Best available rate' : 'Rate based on your risk tier'}
          />
          <StatRow
            label="Risk tier"
            value={
              <span
                className="capitalize"
                style={{
                  color:
                    tier === 'low'
                      ? 'var(--color-risk-low)'
                      : tier === 'medium'
                      ? 'var(--color-risk-medium)'
                      : 'var(--color-risk-high)',
                }}
              >
                {tier}
              </span>
            }
          />
        </div>

        {/* Required collateral callout */}
        <div
          className="mt-4 flex items-start gap-3 p-3.5 rounded-lg text-sm"
          style={{ background: 'var(--color-accent-muted)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <svg
            className="shrink-0 mt-0.5 text-[var(--color-accent)]"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[var(--color-text-secondary)]">
            To receive <strong className="text-[var(--color-text-primary)]">{loanAmount} ETH</strong>,
            you must deposit{' '}
            <strong className="text-[var(--color-text-primary)]">{requiredCollateral} ETH</strong> as
            collateral ({collateralRatio}× ratio).
          </p>
        </div>

        {/* CTA buttons */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Button
            id="confirm-borrow-btn"
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            className="flex-1"
          >
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Deposit collateral &amp; borrow
            </span>
          </Button>

          <Button
            id="reset-loan-btn"
            variant="ghost"
            size="lg"
            onClick={onReset}
          >
            Start over
          </Button>
        </div>

        <p className="mt-3 text-center text-xs text-[var(--color-text-muted)] italic">
          {/* TODO (Sprint 4): remove this notice once real contract calls are wired */}
          Mock mode — &quot;Deposit collateral &amp; borrow&quot; is a no-op until Sprint 4.
        </p>
      </Card>
    </div>
  );
}
