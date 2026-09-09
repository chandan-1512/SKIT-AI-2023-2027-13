import RegisterForm from '../components/auth/RegisterForm';

/**
 * RegisterPage — public route: /register
 * Centered layout wrapping the RegisterForm card.
 */
export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-12 px-4">
      {/* Brand mark above card */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <span
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-glow"
          style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))' }}
        >
          ◈
        </span>
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-gradient">SKIT</span>
          <span className="text-[var(--color-text-secondary)] font-medium"> Lending</span>
        </h1>
      </div>

      <RegisterForm />
    </div>
  );
}
