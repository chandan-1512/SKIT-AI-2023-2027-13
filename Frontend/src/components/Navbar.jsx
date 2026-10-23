import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import WalletConnect from './WalletConnect';

const NAV_LINKS = [
  { to: '/', label: 'Loan Request', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/admin', label: 'Admin' },
];

/**
 * Navbar — top-level navigation shell.
 *
 * Auth-aware (Sprint 2):
 *   - Authenticated  → shows user avatar + display name + Logout button
 *   - Unauthenticated → shows Login / Register links
 *
 * Wallet integration (Sprint 4 — Task 1):
 *   - WalletConnect component handles all MetaMask states via WalletContext.
 */
export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ────────────────────────────────────────── */}
          <NavLink to="/" className="flex items-center gap-2 group">
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

          {/* ── Nav Links (authenticated only) ───────────────── */}
          {isAuthenticated && (
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
          )}

          {/* ── Right side: auth actions ─────────────────────── */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* User avatar + name */}
                <div className="hidden sm:flex items-center gap-2.5">
                  {/* Avatar initials */}
                  <span
                    aria-label={`Signed in as ${user.name}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white select-none"
                    style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))' }}
                  >
                    {getInitials(user.name)}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-secondary)] max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>

                {/* Wallet Connect — Sprint 4, Task 1 */}
                <WalletConnect />

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="sm"
                  id="logout-btn"
                  onClick={handleLogout}
                >
                  <span className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </span>
                </Button>
              </>
            ) : (
              /* Unauthenticated — show Login + Register */
              <div className="flex items-center gap-2">
                <NavLink
                  to="/login"
                  id="nav-login-link"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)]
                             hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]
                             transition-all duration-150"
                >
                  Sign in
                </NavLink>
                <Button
                  variant="primary"
                  size="sm"
                  id="nav-register-btn"
                  onClick={() => navigate('/register')}
                >
                  Get started
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns up to 2 uppercase initials from a display name. */
function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
