import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../Input';
import Button from '../Button';
import Card from '../Card';

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields) {
  const errors = {};

  if (!fields.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_RE.test(fields.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!fields.password) {
    errors.password = 'Password is required.';
  } else if (fields.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * LoginForm — controlled login form with client-side validation.
 *
 * Calls useAuth().login() on valid submit.
 * On success, redirects to the originally requested route (via location state)
 * or falls back to "/".
 */
export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? '/';

  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setServerError('');
    try {
      await login(fields.email, fields.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.message ?? 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto animate-slide-up">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Sign in to access the SKIT AI Lending Protocol.
          </p>
        </div>

        {/* Server-level error banner */}
        {serverError && (
          <div
            id="login-server-error"
            role="alert"
            className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {serverError}
          </div>
        )}

        {/* Form */}
        <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="login-email"
            name="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={fields.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isLoading}
            autoComplete="email"
          />

          <div className="space-y-1">
            <Input
              id="login-password"
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={fields.password}
              onChange={handleChange}
              error={errors.password}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <div className="flex justify-end">
              <span className="text-xs text-[var(--color-text-muted)]">
                {/* TODO (Sprint 4): wire up forgot-password flow */}
                Forgot password? <span className="text-[var(--color-accent)] cursor-not-allowed opacity-60">Reset</span>
              </span>
            </div>
          </div>

          <Button
            id="login-submit-btn"
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-[var(--color-text-muted)]">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-[var(--color-accent)] font-medium hover:text-[var(--color-accent-hover)] transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </Card>
  );
}
