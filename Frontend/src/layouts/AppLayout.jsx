import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ToastContainer } from '../context/ToastContext';

/**
 * AppLayout — shared shell for all protected routes.
 *
 * Sprint 4 — Task 4: Added ToastContainer so toast notifications render
 * above all page content inside the protected route tree.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Page content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-4 text-center text-sm text-[var(--color-text-muted)]">
        SKIT AI Lending Protocol · Sprint 4 — MetaMask + On-chain Integration
      </footer>

      {/* Global toast notifications — z-[200], portal to document.body */}
      <ToastContainer />
    </div>
  );
}
