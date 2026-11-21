# SKIT AI Lending Protocol — Frontend

> **Sprint 4 — All tasks complete.**  
> MetaMask wallet integration, on-chain contract wiring, dashboard event indexing, and global error handling are all live.

---

## Sprint 4 Summary

| Task | Deliverable | Status |
|------|-------------|--------|
| **Task 1** | Wallet Integration — ethers.js v6, `WalletContext`, `WalletConnect` | ✅ Done |
| **Task 2** | Contract Integration — Loan request flow wired to `LoanDecisionRegistry` | ✅ Done |
| **Task 3** | Dashboard Event Indexing — `queryFilter` on-chain loans in both dashboards | ✅ Done |
| **Task 4** | Error Handling & Documentation — global toast system, end-to-end flow docs | ✅ Done |

---

## Sprint 4 — Task 4: Error Handling & End-to-End Documentation

### What was implemented

| # | Deliverable | Files |
|---|-------------|-------|
| 1 | **`ToastContext.jsx`** — global toast provider + `useToast()` hook | `src/context/ToastContext.jsx` |
| 2 | **`ToastContainer`** — portal-rendered toast stack (bottom-right, z-200) | inside `ToastContext.jsx` |
| 3 | **`AppLayout.jsx`** — mounts `ToastContainer` once for all protected routes | `src/layouts/AppLayout.jsx` |
| 4 | **`App.jsx`** — wraps tree in `<ToastProvider>` | `src/App.jsx` |
| 5 | **`WalletContext.jsx`** — emits toasts on connect / disconnect / account / network change | `src/context/WalletContext.jsx` |
| 6 | **`useContractOracle.js`** — emits toasts on submit / mine / oracle response / every error | `src/hooks/useContractOracle.js` |
| 7 | **`contractService.js`** — richer error classifier (nonce, underpriced gas, network mismatch, RPC errors) | `src/services/contractService.js` |
| 8 | **`index.css`** — `toast-shrink` keyframe for auto-dismiss progress bar | `src/index.css` |

### Toast API (`useToast()`)

```js
import { useToast } from '../context/ToastContext';

const { toast, dismiss, dismissAll } = useToast();

// Convenience shortcuts
toast.success('Repayment confirmed!');
toast.error('Transaction failed — insufficient gas.', { duration: 10_000 });
toast.warning('Switch to Sepolia to continue.', { title: 'Wrong Network' });
toast.info('Wallet connected.', { title: 'Wallet' });

// Generic (variant defaults to 'info')
const id = toast('Custom message', { variant: 'success', duration: 8000, title: 'Done' });

// Manual dismissal
dismiss(id);
dismissAll();
```

### Toast coverage — all Sprint 4 error/success scenarios

| Event | Variant | Message |
|-------|---------|---------|
| Wallet connected | success | "Wallet connected." |
| Connection cancelled (user) | warning | "Connection cancelled." |
| Connection failed | error | "Failed to connect wallet." |
| Account switched | info | "Account switched to 0x1234…abcd" |
| Wallet disconnected (MetaMask) | warning | "Wallet disconnected." |
| Soft disconnect (app) | info | "Wallet disconnected from app." |
| Switched to Sepolia / Hardhat | success | "Switched to Sepolia." |
| Switched to wrong network | warning | "Switched to <name>. Please switch to Sepolia…" |
| Network switch cancelled | warning | "Network switch cancelled." |
| Network switch failed | error | "Failed to switch network." |
| Loan tx submitted | info | "Submitting loan application to blockchain…" |
| Loan tx mining | info | "Transaction submitted — waiting for confirmation…" |
| Oracle waiting | info | "Application submitted! Waiting for oracle decision…" |
| Oracle approved | success | "Oracle decision received: Approved!" |
| Oracle rejected | warning | "Oracle decision received: Rejected." |
| User rejected tx (4001) | warning | "Transaction cancelled." |
| Oracle timeout (90 s) | error | "Oracle timed out — decision maker has not responded…" |
| Tx failed on-chain (revert) | error | "Transaction reverted: \<reason\>" |
| Insufficient funds for gas | error | "Insufficient ETH to cover gas fees." |
| Nonce / replacement error | error | "Transaction nonce error — you may have a pending tx." |
| Gas estimation failed | error | "Gas estimation failed — transaction may revert." |
| Network/RPC error | error | "Network error — ensure wallet is on Sepolia." |
| `VITE_CONTRACT_ADDRESS` missing | error | "Contract address not configured." |

---

## End-to-End Local Flow

### Prerequisites

| Service | Location | Start command |
|---------|----------|---------------|
| **Hardhat node** | `contracts/` | `npx hardhat node` |
| **Oracle service** | `oracle-service/` | `npm start` (or `python main.py`) |
| **AI model API** | `ai-model/` | `uvicorn serve:app --port 8000` |
| **Frontend** | `Frontend/` | `npm run dev` |

### 1. Set up environment

```bash
cd Frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_CONTRACT_ADDRESS=<address printed by `npx hardhat run scripts/deploy.js --network localhost`>
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337
VITE_EXPLORER_URL=https://sepolia.etherscan.io
VITE_AI_SCORE_URL=http://localhost:8000
```

> **Important**: restart the dev server after editing `.env` — Vite only reads env vars at startup.

### 2. Keep the ABI in sync

Whenever you change `contracts/LoanDecisionRegistry.sol` and re-compile:

```bash
cd Frontend
npm run copy-abi   # copies Hardhat artifact → src/abi/LoanDecisionRegistry.json
```

The script lives at `Frontend/scripts/copy-abi.js`. Vite picks up the new file automatically in dev mode.

### 3. Run the full flow

```
Browser (port 5173)
  │
  ├── 1. Register / Login
  │       → mockAuthService (Sprint 2; replace with real API in Sprint 5)
  │
  ├── 2. Connect MetaMask wallet
  │       → WalletContext.connect() → eth_requestAccounts
  │       → Toast: "Wallet connected."
  │
  ├── 3. Request a Loan — Stage: AI Form
  │       → ApplicantDetailsForm collects financial details
  │       → POST http://localhost:8000/score (FastAPI AI model)
  │       → AIPredictionResult shown (probability, capability score, decision)
  │
  ├── 4. Request a Loan — Stage: Blockchain Oracle
  │       → LoanRequestForm: user enters ETH amount
  │       → useContractOracle.runOracle(amountEth):
  │           a. getWriteContract(provider).registerLoanApplication(amountWei)
  │              Toast: "Submitting loan application to blockchain…"
  │           b. tx.wait(1)   → Hardhat mines the block
  │              Toast: "Transaction submitted — waiting for confirmation…"
  │           c. Poll getLoanApplicationStatus(appId) every 4 s (up to 90 s)
  │              Toast: "Waiting for oracle decision…"
  │           d. Oracle service sees LoanApplicationSubmitted event →
  │              calls recordLoanDecision(appId, status) → Hardhat mines block
  │              Toast: "Oracle decision received: Approved ✓" or "Rejected"
  │
  ├── 5. Request a Loan — Stage: Terms Display
  │       → LoanTermsDisplay: collateral ratio, APR, due date from loanConfig.js
  │       → "Confirm" button → getWriteContract().recordLoanDecision(appId, 'Approved')
  │          (TODO: replace with LendingPool.depositCollateralAndBorrow() in Sprint 5)
  │
  ├── 6. User Dashboard (/dashboard)
  │       → useLoanEvents({ provider, address })
  │       → queryFilter(LoanApplicationSubmitted, last 50 000 blocks, address-filtered)
  │       → Parallel: getLoanApplicationStatus + decisionExists per app
  │       → Stat cards: Total Borrowed, Approved Loans, Health Factor
  │       → Repay button → RepaymentModal → recordLoanDecision tx
  │          Toast: "Repayment Confirmed" on success
  │
  └── 7. Admin Dashboard (/admin)
          → useLoanEvents({ provider, address: null })  ← all wallets
          → Same queryFilter, unfiltered
          → Stat cards: Total Applications, TVL, Rejection Rate, Avg Collateral
          → Status + Risk Tier filters
          → Borrower addresses linked to Etherscan
```

### 4. Sepolia testnet flow

Same as local, but:

- Use `VITE_CHAIN_ID=11155111` and `VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<key>`
- Contract must be deployed to Sepolia: `npx hardhat run scripts/deploy.js --network sepolia`
- Run `npm run copy-abi` after deploy
- Get Sepolia ETH from https://sepoliafaucet.com or https://faucet.quicknode.com/ethereum/sepolia

---

## Sprint 4 — Task 1: Wallet Integration

### WalletContext API (`useWallet()`)

```js
import { useWallet } from '../context/WalletContext';

const {
  isMetaMaskAvailable, // false if window.ethereum is absent
  isConnected,         // true once user has approved connection
  isCorrectNetwork,    // true on Sepolia (11155111) or local Hardhat (31337)
  isConnecting,        // true while eth_requestAccounts is pending
  address,             // full hex address or null
  addressShort,        // "0x1234…abcd" or null
  chainId,             // numeric chain ID or null
  networkName,         // "Sepolia" | "Hardhat (local)" | "Chain <n>" | null
  provider,            // ethers BrowserProvider instance (for read-only calls)
  connect,             // () => Promise<void>  — triggers MetaMask popup
  disconnect,          // () => void           — clears app state (soft disconnect)
  switchToSepolia,     // () => Promise<void>  — wallet_switchEthereumChain
} = useWallet();
```

### WalletConnect button states

| State | Rendered UI |
|---|---|
| MetaMask not installed | "Install MetaMask" link → metamask.io |
| Not connected | "Connect Wallet" button |
| Connecting (pending) | Spinner + "Connecting…" |
| Connected, Sepolia ✅ | Truncated address + green badge + dropdown |
| Connected, wrong network ⚠️ | Red pulsing address + "Switch to Sepolia" in dropdown |

### Allowed networks

`WalletContext.ALLOWED_CHAIN_IDS` (a `Set`) controls which chains are considered "correct":

```js
import { ALLOWED_CHAIN_IDS } from './context/WalletContext';
// Default: new Set([11155111 /* Sepolia */, 31337 /* local Hardhat */])
```

---

## Sprint 4 — Task 2: Contract Integration

### ABI sync script

```bash
npm run copy-abi
```

The script (`scripts/copy-abi.js`) copies `contracts/artifacts/contracts/LoanDecisionRegistry.sol/LoanDecisionRegistry.json` → `src/abi/LoanDecisionRegistry.json`.

Run it after every `npx hardhat compile`.

### contractService.js

```js
import { getReadContract, getWriteContract, classifyContractError, LoanStatus } from './contractService';

// Read-only
const contract = getReadContract(provider);
const status   = await contract.getLoanApplicationStatus(appId);    // 0|1|2
const exists   = await contract.decisionExists(appId);              // bool

// Write (requires MetaMask signer)
const contract = await getWriteContract(provider);
const tx       = await contract.registerLoanApplication(amountWei);
const receipt  = await tx.wait(1);

// Error handling
try { ... } catch (err) {
  const { message, isUserRejection, isTimeout, isFatal } = classifyContractError(err);
}
```

---

## Sprint 4 — Task 3: Dashboard Event Indexing

### useLoanEvents hook

```js
import { useLoanEvents } from '../hooks/useLoanEvents';

// User dashboard — only current wallet's applications
const { loans, isLoading, error, refetch } = useLoanEvents({ provider, address });

// Admin dashboard — all applications from all wallets
const { loans, isLoading, error, refetch } = useLoanEvents({ provider, address: null });
```

Returned `loan` shape:

```ts
{
  loanId:          string,          // "APP-{n}"
  appId:           bigint,          // raw uint256
  borrower:        string,          // checksummed address (admin view)
  amount:          number,          // ETH (formatted from wei)
  status:          'Pending' | 'Approved' | 'Rejected',
  hasDecision:     boolean,
  appliedAt:       string,          // ISO date string
  riskTier:        'low' | 'medium' | 'high',   // derived from amount
  collateralRatio: number,          // derived from riskTier
  interestRate:    number,          // derived from riskTier
  dueDate:         string,          // estimated (appliedAt + 90 days)
}
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env
# Edit .env — set at minimum VITE_CONTRACT_ADDRESS

# 3. Sync ABI from Hardhat artifacts
npm run copy-abi

# 4. Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
Frontend/
├── public/                  # Static assets (favicon, etc.)
├── scripts/
│   └── copy-abi.js          # Sync Hardhat artifact → src/abi/
├── src/
│   ├── abi/
│   │   └── LoanDecisionRegistry.json   # Contract ABI (synced by copy-abi.js)
│   ├── assets/              # Images, SVGs (Vite-processed)
│   ├── components/          # Reusable presentational UI primitives
│   │   ├── index.js         # Barrel export
│   │   ├── Button.jsx       # variant: primary | secondary | ghost | danger
│   │   ├── Card.jsx         # Glassmorphic container, optional hover lift
│   │   ├── Input.jsx        # Labelled text input with error/hint slots
│   │   ├── StepIndicator.jsx# Horizontal multi-step progress bar
│   │   ├── LoadingSpinner.jsx# Animated SVG spinner (sm/md/lg)
│   │   ├── Badge.jsx        # Risk tier badge: low | medium | high
│   │   ├── Navbar.jsx       # Auth-aware nav with WalletConnect
│   │   ├── WalletConnect.jsx# MetaMask button (5 states)
│   │   ├── auth/            # Auth components
│   │   └── loan/            # Loan module components
│   │       ├── ApplicantDetailsForm.jsx  # Stage 1: AI model form
│   │       ├── LoanRequestForm.jsx       # Stage 2: on-chain oracle
│   │       ├── LoanTermsDisplay.jsx      # Stage 3: decision + confirm
│   │       └── RepaymentModal.jsx        # Repay confirmation dialog
│   ├── config/
│   │   └── loanConfig.js    # Loan bounds, oracle steps, tier→terms mapping
│   ├── context/
│   │   ├── AuthContext.jsx  # AuthProvider + useAuth hook
│   │   ├── WalletContext.jsx# WalletProvider + useWallet hook + toast integration
│   │   └── ToastContext.jsx # ToastProvider + useToast + ToastContainer
│   ├── hooks/
│   │   ├── useContractOracle.js  # Oracle round-trip hook (with toasts)
│   │   └── useLoanEvents.js      # queryFilter hook for dashboards
│   ├── layouts/
│   │   ├── AppLayout.jsx    # Protected shell: Navbar + ToastContainer
│   │   └── AuthLayout.jsx   # Public shell for login / register
│   ├── pages/
│   │   ├── LoanRequestPage.jsx    # Route: / (protected)
│   │   ├── UserDashboardPage.jsx  # Route: /dashboard (protected)
│   │   ├── AdminDashboardPage.jsx # Route: /admin (protected)
│   │   ├── LoginPage.jsx          # Route: /login (public)
│   │   └── RegisterPage.jsx       # Route: /register (public)
│   ├── services/
│   │   ├── contractService.js     # ethers v6 contract wrapper + error classifier
│   │   ├── loanPredictionService.js# FastAPI AI model client
│   │   └── mockAuthService.js     # Fake login/register (replace in Sprint 5)
│   ├── utils/
│   │   └── loanUtils.js           # computeSummaryStats, filterLoans (pure)
│   ├── App.jsx              # Route definitions + provider tree
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles + CSS design token system
├── .env.example             # Environment variable documentation
├── tailwind.config.js
├── vite.config.js
└── README.md
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

---

## Available Scripts

| Script             | Description                                           |
|--------------------|-------------------------------------------------------|
| `npm run dev`      | Start Vite dev server (HMR)                           |
| `npm run build`    | Build production bundle to `dist/`                    |
| `npm run preview`  | Preview production build locally                      |
| `npm run lint`     | Run oxlint across `src/`                              |
| `npm run test`     | Run Vitest test suite (headless)                      |
| `npm run test:ui`  | Open Vitest browser UI                                |
| `npm run copy-abi` | Sync Hardhat contract artifact → `src/abi/`           |

---

## Environment Variables

See [`.env.example`](.env.example) for all variables.  
All vars must be prefixed with `VITE_` to be accessible in-browser via `import.meta.env`.

| Variable               | Description                                             |
|------------------------|---------------------------------------------------------|
| `VITE_CONTRACT_ADDRESS`| Deployed `LoanDecisionRegistry` contract address        |
| `VITE_RPC_URL`         | JSON-RPC endpoint (Alchemy / Infura / local Hardhat)    |
| `VITE_CHAIN_ID`        | Target chain ID (`11155111`=Sepolia, `31337`=local)     |
| `VITE_EXPLORER_URL`    | Block explorer base URL for tx/address links            |
| `VITE_AI_SCORE_URL`    | FastAPI `/score` endpoint base URL                      |

> **Warning**: Never commit `.env` to version control. `.env.example` is safe to commit.

---

## Routes

| Path         | Page                  | Auth        | Status         |
|--------------|-----------------------|-------------|----------------|
| `/login`     | Login                 | Public      | ✅ Sprint 2     |
| `/register`  | Register              | Public      | ✅ Sprint 2     |
| `/`          | Loan Request          | Protected   | ✅ Sprint 4     |
| `/dashboard` | User Dashboard        | Protected   | ✅ Sprint 4     |
| `/admin`     | Admin Dashboard       | Admin only  | ✅ Sprint 4     |

---

## Upcoming

- **Sprint 5**: Replace `mockAuthService` with real JWT API; add `LendingPool.sol` deposit/borrow/repay; admin approval flow in Admin Dashboard.
