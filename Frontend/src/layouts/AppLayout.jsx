import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

/**
 * AppLayout — shared shell for all routes.
 * Contains the Navbar + a max-width constrained page container.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Page content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Outlet />
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-[var(--color-border)] py-4 text-center text-sm text-[var(--color-text-muted)]">
        SKIT AI Lending Protocol — Sprint 1 Scaffold
      </footer>
    </div>
  );
}
