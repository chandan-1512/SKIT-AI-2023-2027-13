import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

// Public pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected pages
import LoanRequestPage from './pages/LoanRequestPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public auth routes (no Navbar / protected shell) ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── Protected routes (require auth, share AppLayout shell) ── */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index path="/" element={<LoanRequestPage />} />
          <Route path="/dashboard" element={<UserDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
