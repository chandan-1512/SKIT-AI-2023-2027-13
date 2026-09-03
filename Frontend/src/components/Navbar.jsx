import { NavLink } from 'react-router-dom';
import Button from './Button';

const NAV_LINKS = [
  { to: '/', label: 'Loan Request', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/admin', label: 'Admin' },
];

/**
 * Navbar — top-level navigation shell.
 *
 * Wallet connect button is intentionally non-functional (placeholder).
 * ethers.js + MetaMask integration lands in a later sprint.
 */
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ── Logo ────────────────────────────────────────── */}
          <NavLink to="/" className="flex items-center gap-2 group">
            {/* Geometric accent mark */}
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold
                         transition-all duration-200 group-hover:shadow-[0_0_16px_var(--color-accent)]"
              style={{ background: 'var(--color-accent)' }}
            >
              ◈
            </span>
            <span className="font-bold text-lg tracking-tight">
              <span className="text-gradient">SKIT</span>
              <span className="text-[var(--color-text-secondary)] font-medium"> Lending</span>
            </span>
          </NavLink>

          {/* ── Nav Links ───────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── Wallet Connect (Placeholder) ─────────────────── */}
          <div className="flex items-center gap-3">
            {/* Mobile nav — simple dots indicator (hamburger in later sprint) */}
            <div className="flex md:hidden gap-1">
              {NAV_LINKS.map(({ to }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `w-2 h-2 rounded-full transition-colors ${
                      isActive
                        ? 'bg-[var(--color-accent)]'
                        : 'bg-[var(--color-border)]'
                    }`
                  }
                />
              ))}
            </div>

            <Button
              variant="primary"
              size="sm"
              id="wallet-connect-btn"
              onClick={() => {
                /* Wallet integration — Sprint 2 */
              }}
            >
              <span className="flex items-center gap-2">
                {/* Wallet icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M16 12h2" />
                </svg>
                Connect Wallet
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
