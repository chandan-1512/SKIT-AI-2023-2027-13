# US4 — Web3.js Integration Preparation

## 1. Overview

This module provides a read-only Web3.js integration layer for the
LoanDecisionRegistry smart contract deployed on the Sepolia test network.

It verifies network connectivity, checks the deployed contract bytecode,
loads the compiled contract ABI, and retrieves loan application data.

Scope: Web3 integration preparation and read-only blockchain access.

Scheduled period: 21 October 2026 – 25 November 2026.

## 2. Technology Stack

- JavaScript (ES modules)
- Web3.js 4.16.0
- Node.js
- Ethereum Sepolia test network
- Solidity smart contract
- Hardhat compiled contract artifact
- dotenv for environment configuration
- Node.js built-in test runner

## 3. Deployed Contract Configuration

| Property | Value |
|---|---|
| Network | Sepolia |
| Chain ID | 11155111 |
| Contract | LoanDecisionRegistry |
| Contract address | 0xc7E21E406ECB753eD0b9caB836601057a0577eD8 |
| ABI source | artifacts/contracts/LoanDecisionRegistry.sol/LoanDecisionRegistry.json |

The service checks the network chain ID and verifies that contract bytecode
exists at the configured address before returning a contract instance.

## 4. Service Module

File: services/blockchainService.js

### Exported functions

- connectReadOnly() — connects to Sepolia and validates the deployed contract.
- getApplicationCounter() — retrieves the total application count.
- getApplicationSummary(applicationId) — retrieves a validated application summary.
- getApplicationStatus(applicationId) — returns application status and decision information.
- getApplicantApplications(address) — retrieves applications associated with an Ethereum address.
- validateApplicationId(id) — validates positive integer application IDs.
- validateAddress(address) — validates and checksums Ethereum addresses.
- mapApplicationStatus(status) — maps numeric contract statuses to readable values.

### Application status mapping

| Contract value | Status |
|---|---|
| 0 | Pending |
| 1 | Approved |
| 2 | Rejected |

Loan amounts are returned as strings to preserve integer precision.

## 5. Environment Configuration

Create or maintain a local .env file in the BlockChain project root.

Required variable:

SEPOLIA_RPC_URL

Optional variable:

LOAN_DECISION_REGISTRY_ADDRESS

If the optional contract address is not provided, the service uses its
configured default address.

The read-only service does not require a private key. Never commit .env
files, private keys, API credentials, or RPC secrets.

## 6. Verification and Testing

Run commands from the BlockChain project root.

### Unit tests

npm test
The unit tests cover:
- Sepolia chain ID configuration
- Supported application statuses
- Valid and invalid application IDs
- Status mapping
- Valid and invalid Ethereum addresses

### Live Sepolia verification

npm run verify:sepolia
The verification script checks network connectivity, chain ID, deployed
contract bytecode, application count, and up to two application summaries.

Live verification requires a working Sepolia RPC endpoint and network access.

## 7. Verified Results

The live read-only verification completed successfully on 29 October 2026.

- Sepolia chain ID verified: 11155111
- Contract bytecode verified at the configured address
- Application counter returned: 2
- Application 1 returned status: Approved
- Application 2 returned status: Rejected
- Both application summaries reported hasDecision: true

These results describe the deployed test contract at the time of verification.
They do not establish real-world loan approval or disbursement.

## 8. Safety and Scope Limitations

- No contract deployment is performed by this service.
- No blockchain write transactions are submitted.
- No private key or transaction signer is used.
- Sepolia is a test network, not a production banking environment.
- Backend API integration, transaction workflows, and additional integration
  checks remain separate implementation tasks.

## 9. Next Steps
1. Integrate blockchain reads with backend APIs.
2. Develop the required transaction workflow in the scheduled phase.
3. Add appropriate integration and error-handling tests.
4. Document subsequent implementation and verification results.