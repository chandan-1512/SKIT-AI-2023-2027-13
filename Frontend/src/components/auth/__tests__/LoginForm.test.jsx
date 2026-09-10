/**
 * LoginForm.test.jsx
 *
 * Tests:
 *  1. Empty submit → field-level errors shown
 *  2. Invalid email format → email error shown
 *  3. Password shorter than 8 chars → password error shown
 *  4. Valid credentials → mockLogin called (navigation happens internally)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext';
import LoginForm from '../LoginForm';

// ── Stubs ──────────────────────────────────────────────────────────────────────

// Stub the mock auth service so tests run instantly (no 600 ms delay)
vi.mock('../../../services/mockAuthService', () => ({
  mockLogin: vi.fn().mockResolvedValue({ name: 'Test User', email: 'user@test.com' }),
  mockRegister: vi.fn(),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderForm() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </MemoryRouter>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows required-field errors when submitted empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows an error for an invalid email format', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^password/i), 'validpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('shows an error when password is shorter than 8 characters', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), 'user@test.com');
    await user.type(screen.getByLabelText(/^password/i), 'short');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/at least 8/i)).toBeInTheDocument();
  });

  it('calls mockLogin after submitting valid credentials', async () => {
    const { mockLogin } = await import('../../../services/mockAuthService');
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), 'user@test.com');
    await user.type(screen.getByLabelText(/^password/i), 'validpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledOnce());
    expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'validpassword');
  });
});
