/**
 * AuthContext.jsx — Application-wide authentication state.
 *
 * Provides: AuthProvider (wrap the app), useAuth() hook (consume anywhere).
 *
 * Session persistence strategy: sessionStorage
 *   - Survives page refreshes within the same tab
 *   - Cleared automatically when the tab is closed
 *   - TODO (Sprint 4): swap for HttpOnly cookie or JWT in localStorage once
 *     a real backend issues tokens.
 */

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { mockLogin, mockRegister } from '../services/mockAuthService';

// ─── Context ──────────────────────────────────────────────────────────────────

/**
 * @typedef {{ id: string, name: string, email: string }} AuthUser
 *
 * @typedef {{
 *   user: AuthUser | null,
 *   isAuthenticated: boolean,
 *   isLoading: boolean,
 *   login: (email: string, password: string) => Promise<void>,
 *   register: (name: string, email: string, password: string) => Promise<void>,
 *   logout: () => void,
 * }} AuthContextValue
 */

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

const SESSION_KEY = 'skit_auth_user';

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * AuthProvider — wrap your root component with this.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Rehydrate session from sessionStorage on first render
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Keep sessionStorage in sync whenever user changes
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  /**
   * Log in with email + password.
   * TODO (Sprint 4): mockLogin → real API call. Signature stays the same.
   */
  const login = useCallback(async (email, password) => {
    const authedUser = await mockLogin(email, password);
    setUser(authedUser);
  }, []);

  /**
   * Register a new account.
   * TODO (Sprint 4): mockRegister → real API call. Signature stays the same.
   */
  const register = useCallback(async (name, email, password) => {
    const authedUser = await mockRegister(name, email, password);
    setUser(authedUser);
  }, []);

  /** Clear session — redirects are handled by ProtectedRoute / callers. */
  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth — consume auth context anywhere inside AuthProvider.
 *
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>. Check your component tree.');
  }
  return ctx;
}
