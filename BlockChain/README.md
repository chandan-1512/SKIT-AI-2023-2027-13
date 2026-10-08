# Blockchain Module — AI-Powered Loan Approval Smart Contract

This folder contains the blockchain module of the AI-Powered Loan Approval Smart Contract project.

The module is developed using Solidity, Hardhat 3, TypeScript and ethers.js, with Ethereum Sepolia used for blockchain deployment and testing.

---

## Technology Stack

- Solidity
- Hardhat 3
- TypeScript
- ethers.js
- Hardhat Toolbox
- Ethereum Sepolia Testnet
- dotenv

---

## Project Structure

```text
BlockChain/
├── contracts/
│   └── LoanDecisionRegistry.sol
├── scripts/
│   ├── check-sepolia-deployer.ts
│   └── deploy.ts
├── test/
│   └── LoanDecisionRegistry.ts
├── config/
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
└── sepolia-deployment.md

---

## Blockchain Module Overview

The blockchain module provides a decentralized and tamper-resistant layer for recording loan application and loan decision information.

In this project, the blockchain layer is responsible for maintaining important loan-related records through the `LoanDecisionRegistry` smart contract. The smart contract stores application details, tracks the application status, and records approval or rejection decisions.

Ethereum Sepolia is used as the development and testing network. This allows the blockchain workflow to be tested using real blockchain transactions without interacting with the Ethereum mainnet.

---

## Blockchain Working Theory

The blockchain component follows a smart-contract-based workflow.

### 1. Loan Application Registration

When a loan application is submitted to the blockchain layer, the smart contract creates a unique application ID and stores the applicant's blockchain address, requested loan amount, application timestamp, and current application status.

New applications initially receive the `Pending` status.

### 2. Smart Contract State Management

The `LoanDecisionRegistry` contract maintains the application information on-chain.

Each application contains:

- Application ID
- Applicant address
- Loan amount
- Application status
- Application timestamp

The contract also maintains application records associated with individual applicants.

### 3. Loan Decision

The configured decision maker can record the final loan decision through the smart contract.

The application status can be updated to:

- `Approved`
- `Rejected`

The decision is stored on the blockchain along with the relevant decision information.

### 4. Blockchain Verification

Because the application and decision records are stored through a smart contract, the recorded transaction can be verified on the blockchain network.

The transaction history provides evidence of when a blockchain operation was executed and which account initiated it.

### 5. Sepolia Test Network

The project uses Ethereum Sepolia for development and testing.

The current `LoanDecisionRegistry` contract has been deployed on Sepolia and validated through both read operations and a state-changing transaction.

---

## Blockchain Workflow

```text
Loan Application
       │
       ▼
Backend / Application Layer
       │
       ▼
LoanDecisionRegistry Smart Contract
       │
       ├── Register Application
       │
       ├── Store Loan Amount
       │
       ├── Track Application Status
       │
       └── Record Loan Decision
       │
       ▼
Ethereum Sepolia Network
       │
       ▼
Blockchain Transaction
       │
       ▼
On-Chain Loan Record
```

