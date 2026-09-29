/**
 * AdminRoute.jsx — Authorization guard for admin-only pages.
 *
 * Usage (inside a ProtectedRoute parent):
 *   <Route element={<AdminRoute />}>
 *     <Route path="/admin" element={<AdminDashboardPage />} />
 *   </Route>
 *
 * Behaviour:
 *   - If the user IS an admin  → renders <Outlet /> (child routes)
 *   - If the user is NOT admin → silently redirects to /dashboard
 *
 * The isAdmin flag is derived from `user.email` matching `admin@*`
 * inside mockAuthService (Sprint 4: swap for a JWT role claim).
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
