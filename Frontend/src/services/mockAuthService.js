/**
 * mockAuthService.js — Simulated authentication API calls.
 *
 * TODO (Sprint 4): Replace every function in this file with real REST/GraphQL
 * calls to the backend auth service. The function signatures (args + return
 * shape) are intentionally designed to be drop-in compatible with a real API.
 *
 * Rejection test hook:
 *   - Use email "fail@test.com" in tests to trigger a deterministic 401 error
 *     without needing a real backend.
 */

const MOCK_DELAY_MS = 600;

/** @typedef {{ id: string, name: string, email: string }} AuthUser */

/**
 * Simulate a login request.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<AuthUser>}
 */
export async function mockLogin(email, password) {
  // TODO (Sprint 4): replace with → await apiClient.post('/auth/login', { email, password })
  await delay(MOCK_DELAY_MS);

  if (email === 'fail@test.com') {
    throw new Error('Invalid email or password. Please try again.');
  }

  // Any other valid-format credentials succeed in mock mode
  return buildMockUser(email);
}

/**
 * Simulate a registration request.
 *
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<AuthUser>}
 */
export async function mockRegister(name, email, password) {
  // TODO (Sprint 4): replace with → await apiClient.post('/auth/register', { name, email, password })
  await delay(MOCK_DELAY_MS);

  if (email === 'fail@test.com') {
    throw new Error('An account with this email already exists.');
  }

  return buildMockUser(email, name);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMockUser(email, name) {
  const displayName = name ?? email.split('@')[0];
  return {
    id: `mock-uid-${Math.random().toString(36).slice(2, 9)}`,
    name: displayName,
    email,
  };
}
