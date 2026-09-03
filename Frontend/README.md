# SKIT AI Lending Protocol — Frontend

> Sprint 1 scaffold: Vite + React + Tailwind CSS + React Router.  
> No blockchain integration yet — ethers.js / MetaMask lands in Sprint 2.

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
│   │   └── Navbar.jsx       # App navigation + placeholder wallet button
│   ├── layouts/
│   │   └── AppLayout.jsx    # Shared shell: Navbar + max-width container
│   ├── pages/
│   │   ├── LoanRequestPage.jsx    # Route: /
│   │   ├── UserDashboardPage.jsx  # Route: /dashboard
│   │   └── AdminDashboardPage.jsx # Route: /admin
│   ├── App.jsx              # Route definitions (React Router v6)
│   ├── main.jsx             # Entry point — mounts App inside BrowserRouter
│   └── index.css            # Global styles + CSS design token system
├── .env.example             # Environment variable documentation
├── .eslintrc.cjs            # ESLint config (react, react-hooks, react-refresh)
├── .prettierrc              # Prettier formatting rules
├── tailwind.config.js       # Tailwind v3 config (CSS-variable accent theme)
├── postcss.config.js        # PostCSS (Tailwind + Autoprefixer)
├── vite.config.js           # Vite configuration
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

| Path         | Page                  | Status      |
|--------------|-----------------------|-------------|
| `/`          | Loan Request          | Placeholder |
| `/dashboard` | User Dashboard        | Placeholder |
| `/admin`     | Admin Dashboard       | Placeholder |

---

## Available Scripts

| Script            | Description                         |
|-------------------|-------------------------------------|
| `npm run dev`     | Start Vite dev server (HMR)         |
| `npm run build`   | Build production bundle to `dist/`  |
| `npm run preview` | Preview production build locally    |
| `npm run lint`    | Run ESLint across `src/`            |

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

## Upcoming Sprints

- **Sprint 2**: MetaMask wallet connection (ethers.js v6), `useWallet` hook
- **Sprint 3**: Contract read — loan state, risk score, health factor
- **Sprint 4**: Contract write — submit loan request, repay, liquidate
- **Sprint 5**: AI risk tier integration + admin approval flow
