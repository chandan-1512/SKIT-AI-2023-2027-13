import { Outlet } from 'react-router-dom';

/**
 * AuthLayout — minimal shell for public auth routes (/login, /register).
 * No Navbar; just a full-height page area with the gradient background.
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
