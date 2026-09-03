import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

const MOCK_REQUESTS = [
  { id: 'REQ-001', borrower: '0xAbCd…1234', amount: '2.5 ETH', tier: 'low', score: 82 },
  { id: 'REQ-002', borrower: '0xDeF0…5678', amount: '10.0 ETH', tier: 'high', score: 34 },
  { id: 'REQ-003', borrower: '0x1234…ABcd', amount: '1.2 ETH', tier: 'medium', score: 61 },
];

const PROTOCOL_STATS = [
  { label: 'Total Value Locked', value: '$124,830', sub: '≈ 43.2 ETH' },
  { label: 'Active Borrowers', value: '18', sub: 'unique addresses' },
  { label: 'Default Rate', value: '0.8%', sub: 'last 30 days' },
  { label: 'Avg Risk Score', value: '67 / 100', sub: 'across all loans' },
];

/**
 * AdminDashboardPage — placeholder for protocol admin controls.
 * On-chain read/write lands in a later sprint.
 */
export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-slide-up">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1">Admin Dashboard</h1>
          <p className="text-[var(--color-text-muted)]">
            Protocol health, pending approvals, and risk oversight.
          </p>
        </div>
        {/* Admin role indicator */}
        <span className="px-3 py-1 rounded-full text-xs font-bold border border-[var(--color-accent)]/40 text-[var(--color-accent)] bg-[var(--color-accent-muted)]">
          ADMIN
        </span>
      </div>

      {/* Protocol stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PROTOCOL_STATS.map((s) => (
          <Card key={s.label} hoverable>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              {s.label}
            </p>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Pending loan requests */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Pending Loan Requests</h2>
          <Button variant="ghost" size="sm" id="admin-refresh-btn">
            ↻ Refresh
          </Button>
        </div>

        <div className="space-y-3">
          {MOCK_REQUESTS.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)]"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-semibold">{req.id}</p>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono">{req.borrower}</p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{req.amount}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Requested</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Risk score bar */}
                <div className="hidden md:flex flex-col items-end gap-1 w-24">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Score: <strong className="text-[var(--color-text-primary)]">{req.score}</strong>
                  </span>
                  <div className="w-full h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${req.score}%`,
                        background:
                          req.score >= 70
                            ? 'var(--color-risk-low)'
                            : req.score >= 50
                            ? 'var(--color-risk-medium)'
                            : 'var(--color-risk-high)',
                      }}
                    />
                  </div>
                </div>

                <Badge tier={req.tier} />

                <div className="flex gap-2">
                  <Button variant="primary" size="sm" id={`approve-${req.id}`}>
                    Approve
                  </Button>
                  <Button variant="danger" size="sm" id={`reject-${req.id}`}>
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
