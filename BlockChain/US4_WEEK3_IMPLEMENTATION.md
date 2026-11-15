
# US4 Week 3 – Backend Blockchain Integration

## 1. Objective

Implement Web3.js integration with the LoanDecisionRegistry smart contract deployed on the Sepolia test network.

## 2. Technology Stack

- Node.js
- Express.js
- Web3.js
- Solidity
- Hardhat
- Ethereum Sepolia Testnet

## 3. Implemented Features

1. Sepolia network connectivity and chain ID validation.
2. Smart contract ABI loading and contract initialization.
3. Reading application counter, summary, status and applicant history.
4. AI prediction mapping:
   - 1 = Approved
   - 0 = Rejected
5. DecisionMaker wallet authorization.
6. Signed blockchain transactions using Web3.js.
7. Transaction receipt handling and on-chain verification.
8. Duplicate decision protection.
9. Protected Express API endpoint for recording AI decisions.
10. Input validation and error handling.

## 4. API Endpoint

POST /api/applications/:applicationId/decision

Authentication:
x-api-key

Request body:

{
  "prediction": 1
}

Prediction mapping:
- 1: Approved
- 0: Rejected

## 5. Sepolia Integration Testing

### Approved Decision

- Application ID: 4
- Initial status: Pending
- Final status: Approved
- Transaction hash:
  0xde8bc3... (complete hash to be added from API response)
- Duplicate request protection: Verified

Registration transaction:
0xbe82808947ac6a94d8b4b2cf0f5904dc71d0d370f08378f5cdc759a7c2dddf51

### Rejected Decision

- Application ID: 5
- Initial status: Pending
- Final status: Rejected
- Registration transaction:
  0x806f7234f7ad8effb754cda3b5dbbd224d2cdff2b64c9cc7576d11a1bf36f51
- Decision transaction hash: Add complete hash from API response.

## 6. Automated Testing

Command:

npm test

Result:
- Total tests: 13
- Passed: 13
- Failed: 0

Test coverage:
- Sepolia chain ID
- Application ID validation
- Ethereum address validation
- Application status mapping
- AI prediction mapping

## 7. Security Measures

- Private key stored in environment variables.
- DecisionMaker authorization verified before transaction.
- API key authentication for decision endpoint.
- Duplicate decisions prevented.
- On-chain decision verified after transaction.

## 8. Outcome

Web3.js integration successfully records AI-generated loan decisions on the Sepolia blockchain through the authorized DecisionMaker wallet.
