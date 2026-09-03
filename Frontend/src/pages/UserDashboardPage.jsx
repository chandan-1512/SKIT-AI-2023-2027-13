import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

const MOCK_LOANS = [
  { id: 'LOAN-001', amount: '2.5 ETH', duration: '30 days', tier: 'low', status: 'Active' },
  { id: 'LOAN-002', amount: '0.8 ETH', duration: '14 days', tier: 'medium', status: 'Pending' },
  { id: 'LOAN-003', amount: '5.0 ETH', duration: '90 days', tier: 'high', status: 'Repaid' },
];

const STAT_CARDS = [
  { label: 'Total Borrowed', value: '8.3 ETH', sub: 'across 3 loans' },
  { label: 'Active Loans', value: '1', sub: 'loan currently open' },
  { label: 'Health Factor', value: '1.82', sub: 'above liquidation threshold' },
];

/**
 * UserDashboardPage — placeholder for borrower portfolio view.
 * Data fetching from contract lands in a later sprint.
 */
export default function UserDashboardPage() {
  return (
    <div className="space-y-8 animate-slide-up">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-1">My Dashboard</h1>
        <p className="text-[var(--color-text-muted)]">
          Overview of your loan portfolio and borrowing history.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map((stat) => (
          <Card key={stat.label} hoverable>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{stat.sub}</p>
          </Card>
        ))}
      </div>

      {/* Loan table */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Loan History</h2>
          <Button variant="secondary" size="sm" id="new-loan-btn">
            + New Loan
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['Loan ID', 'Amount', 'Duration', 'Risk Tier', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-3 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {MOCK_LOANS.map((loan) => (
                <tr key={loan.id} className="hover:bg-[var(--color-surface-elevated)] transition-colors">
                  <td className="py-3 pr-4 font-mono text-[var(--color-text-secondary)]">{loan.id}</td>
                  <td className="py-3 pr-4 font-medium">{loan.amount}</td>
                  <td className="py-3 pr-4 text-[var(--color-text-secondary)]">{loan.duration}</td>
                  <td className="py-3 pr-4">
                    <Badge tier={loan.tier} />
                  </td>
                  <td className="py-3">
                    <span
                      className={[
                        'text-xs font-semibold px-2.5 py-1 rounded-full',
                        loan.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : loan.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]',
                      ].join(' ')}
                    >
                      {loan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
