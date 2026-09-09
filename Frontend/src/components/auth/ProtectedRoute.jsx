import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — gates any route behind authentication.
 *
 * Wraps a route's element prop. If the user is not authenticated,
 * redirects to /login and preserves the intended destination in
 * location state so LoginForm can redirect back after login.
 *
 * Usage in App.jsx:
 *   <Route path="/dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
