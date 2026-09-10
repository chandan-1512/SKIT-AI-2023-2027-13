# SKIT AI Lending Protocol — Frontend

> **Sprint 2** — Auth Layer + Loan Application Module + Vitest test suite.  
> Login, Registration, oracle credit-score simulation, and loan terms display are all functional.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env
# (No values needed yet — just here for documentation)

# 3. Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
Frontend/
├── public/                  # Static assets (favicon, etc.)
├── src/
│   ├── assets/              # Images, SVGs (Vite-processed)
│   ├── components/          # Reusable presentational UI primitives
│   │   ├── index.js         # Barrel export — import all from here
│   │   ├── Button.jsx       # variant: primary | secondary | ghost | danger
│   │   ├── Card.jsx         # Glassmorphic container, optional hover lift
│   │   ├── Input.jsx        # Labelled text input with error/hint slots
│   │   ├── StepIndicator.jsx# Horizontal multi-step progress bar
│   │   ├── LoadingSpinner.jsx# Animated SVG spinner (sm/md/lg)
│   │   ├── Badge.jsx        # Risk tier badge: low | medium | high
│   │   ├── Navbar.jsx       # Auth-aware nav: user+logout or login/register links
│   │   ├── auth/            # Sprint 2 auth components
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── loan/            # Sprint 2 loan module components
│   │       ├── LoanRequestForm.jsx
│   │       └── LoanTermsDisplay.jsx
│   ├── config/
│   │   └── loanConfig.js    # Loan bounds, oracle steps, tier→terms mapping
│   ├── context/
│   │   └── AuthContext.jsx  # AuthProvider + useAuth hook (sessionStorage)
│   ├── layouts/
│   │   ├── AppLayout.jsx    # Protected shell: Navbar + max-width container
│   │   └── AuthLayout.jsx   # Public shell for login / register pages
│   ├── pages/
│   │   ├── LoanRequestPage.jsx    # Route: / (protected)
│   │   ├── UserDashboardPage.jsx  # Route: /dashboard (protected)
│   │   ├── AdminDashboardPage.jsx # Route: /admin (protected)
│   │   ├── LoginPage.jsx          # Route: /login (public)
│   │   └── RegisterPage.jsx       # Route: /register (public)
│   ├── services/
│   │   └── mockAuthService.js     # Fake login/register (600 ms delay)
│   ├── test/
│   │   └── setup.js               # jest-dom import for Vitest
│   ├── App.jsx              # Route definitions (React Router v7)
│   ├── main.jsx             # Entry point — mounts App inside BrowserRouter
│   └── index.css            # Global styles + CSS design token system
├── .env.example             # Environment variable documentation
├── .eslintrc.cjs            # ESLint config (react, react-hooks, react-refresh)
├── .prettierrc              # Prettier formatting rules
├── tailwind.config.js       # Tailwind v3 config (CSS-variable accent theme)
├── postcss.config.js        # PostCSS (Tailwind + Autoprefixer)
├── vite.config.js           # Vite + Vitest configuration
└── README.md                # This file
```

---

## Theming

The entire color scheme is driven by a **single CSS variable**. To retheme:

```css
/* src/index.css → :root */
--color-accent:       #6366f1;   /* ← change only this line */
--color-accent-hover: #4f46e5;   /* ← and this */
--color-accent-muted: rgba(99, 102, 241, 0.15);
```

All Tailwind utilities (`bg-accent`, `text-accent`, `shadow-glow`, etc.) read from these
variables automatically — no `tailwind.config.js` edit needed to retheme.

---

## Component Usage

```jsx
import { Button, Card, Input, StepIndicator, LoadingSpinner, Badge } from '../components';

// Button variants
<Button variant="primary" size="md" onClick={fn}>Submit</Button>
<Button variant="secondary" loading>Waiting...</Button>
<Button variant="ghost" disabled>Disabled</Button>

// Card — glassmorphic container
<Card hoverable>
  <p>Content here</p>
</Card>

// Input — with validation error
<Input
  label="Wallet Address"
  placeholder="0x..."
  value={val}
  onChange={(e) => setVal(e.target.value)}
  error="Invalid address format"
/>

// StepIndicator
<StepIndicator steps={['Details', 'Review', 'Submit']} currentStep={1} />

// LoadingSpinner
<LoadingSpinner size="lg" />

// Badge — risk tier
<Badge tier="low" />    // green
<Badge tier="medium" /> // amber
<Badge tier="high" />   // red
```

---

## Routes

| Path         | Page                  | Auth        | Status      |
|--------------|-----------------------|-------------|-------------|
| `/login`     | Login                 | Public      | ✅ Sprint 2  |
| `/register`  | Register              | Public      | ✅ Sprint 2  |
| `/`          | Loan Request          | Protected   | ✅ Sprint 2  |
| `/dashboard` | User Dashboard        | Protected   | Placeholder |
| `/admin`     | Admin Dashboard       | Protected   | Placeholder |

---

## Available Scripts

| Script             | Description                            |
|--------------------|----------------------------------------|
| `npm run dev`      | Start Vite dev server (HMR)            |
| `npm run build`    | Build production bundle to `dist/`     |
| `npm run preview`  | Preview production build locally       |
| `npm run lint`     | Run oxlint across `src/`               |
| `npm run test`     | Run Vitest test suite (headless)       |
| `npm run test:ui`  | Open Vitest browser UI                 |

---

## Environment Variables

See [`.env.example`](.env.example) for all variables.  
All vars must be prefixed with `VITE_` to be accessible in-browser via `import.meta.env`.

| Variable               | Description                                 |
|------------------------|---------------------------------------------|
| `VITE_CONTRACT_ADDRESS`| Deployed lending contract address           |
| `VITE_RPC_URL`         | JSON-RPC endpoint (Alchemy / Infura / local)|

> Warning: Never commit `.env` to version control. `.env.example` is safe to commit.

---

## Mock / Sprint 4 Replacements

Every mocked piece is clearly marked with `// TODO (Sprint 4)` in the source.

| Mock piece | File | Sprint 4 replacement |
|---|---|---|
| `mockLogin` / `mockRegister` (600 ms fake delay) | `src/services/mockAuthService.js` | Real API call to backend `/auth/login` and `/auth/register` endpoints |
| Session stored in `sessionStorage` | `src/context/AuthContext.jsx` | JWT from API, stored in `httpOnly` cookie or secure storage |
| Oracle step simulation (`setTimeout` chain) | `src/components/loan/LoanRequestForm.jsx` → `runMockOracle()` | Chainlink / custom oracle subscription; same `onStepChange` callback signature |
| Random credit score (300–850) | `src/components/loan/LoanRequestForm.jsx` | Real oracle response value |
| Loan bounds (`MIN_LOAN_ETH`, `MAX_LOAN_ETH`) | `src/config/loanConfig.js` | On-chain reads via `ethers.js` contract ABI |
| Collateral ratio & interest rate per tier | `src/config/loanConfig.js` → `tierToTerms()` | Smart contract ABI read |
| "Deposit collateral & borrow" no-op button | `src/components/loan/LoanTermsDisplay.jsx` → `handleConfirm()` | `depositCollateralAndBorrow(amount, collateral)` contract call via ethers.js |

---

## Upcoming Sprints

- **Sprint 3**: Contract read — loan state, risk score, health factor
- **Sprint 4**: Contract write — submit loan request, repay, liquidate; replace all mocks above
- **Sprint 5**: AI risk tier integration + admin approval flow
