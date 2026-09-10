/**
 * RegisterForm.test.jsx
 *
 * Tests:
 *  1. Empty submit → field-level errors shown
 *  2. Password mismatch → confirmPassword error shown
 *  3. Password shorter than 8 chars → password error shown
 *  4. Valid registration → mockRegister is called with correct args
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext';
import RegisterForm from '../RegisterForm';

// ── Stubs ──────────────────────────────────────────────────────────────────────

vi.mock('../../../services/mockAuthService', () => ({
  mockLogin: vi.fn(),
  mockRegister: vi.fn().mockResolvedValue({ name: 'New User', email: 'new@test.com' }),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderForm() {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    </MemoryRouter>
  );
}

async function fillForm(user, {
  name = 'Test User',
  email = 'new@test.com',
  password = 'validpass',
  confirm = 'validpass',
} = {}) {
  if (name)     await user.type(screen.getByLabelText(/full name/i), name);
  if (email)    await user.type(screen.getByLabelText(/email address/i), email);
  if (password) await user.type(screen.getByLabelText(/^password/i), password);
  if (confirm)  await user.type(screen.getByLabelText(/confirm password/i), confirm);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('RegisterForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows required-field errors when submitted empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderForm();

    await fillForm(user, { password: 'validpass1', confirm: 'different99' });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows error when password is shorter than 8 characters', async () => {
    const user = userEvent.setup();
    renderForm();

    await fillForm(user, { password: 'short', confirm: 'short' });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/at least 8/i)).toBeInTheDocument();
  });

  it('calls mockRegister after a valid registration', async () => {
    const { mockRegister } = await import('../../../services/mockAuthService');
    const user = userEvent.setup();
    renderForm();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledOnce());
    expect(mockRegister).toHaveBeenCalledWith('Test User', 'new@test.com', 'validpass');
  });
});
