import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../Input';
import Button from '../Button';
import Card from '../Card';

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields) {
  const errors = {};

  if (!fields.name.trim()) {
    errors.name = 'Full name is required.';
  } else if (fields.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

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

  if (!fields.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * RegisterForm — controlled registration form with client-side validation.
 *
 * Validates: name (required, min 2), email (required, format),
 *            password (required, min 8), confirmPassword (must match password).
 */
export default function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
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
      await register(fields.name.trim(), fields.email, fields.password);
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message ?? 'Registration failed. Please try again.');
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
            Create an account
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Join the SKIT AI Lending Protocol — it&apos;s free.
          </p>
        </div>

        {/* Server-level error banner */}
        {serverError && (
          <div
            id="register-server-error"
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
        <form id="register-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="register-name"
            name="name"
            label="Full name"
            type="text"
            placeholder="Alice Nakamoto"
            value={fields.name}
            onChange={handleChange}
            error={errors.name}
            disabled={isLoading}
            autoComplete="name"
          />

          <Input
            id="register-email"
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

          <Input
            id="register-password"
            name="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={fields.password}
            onChange={handleChange}
            error={errors.password}
            hint="Must be at least 8 characters."
            disabled={isLoading}
            autoComplete="new-password"
          />

          <Input
            id="register-confirm-password"
            name="confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            value={fields.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            disabled={isLoading}
            autoComplete="new-password"
          />

          <Button
            id="register-submit-btn"
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[var(--color-accent)] font-medium hover:text-[var(--color-accent-hover)] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}
