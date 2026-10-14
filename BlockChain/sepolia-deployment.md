# Sepolia Deployment and Event Validation

## 1. Deployment Details

- **Network:** Ethereum Sepolia
- **Contract:** `LoanDecisionRegistry`
- **Contract Address:** `0xc7E21E406ECB753eD0b9caB836601057a0577eD8`
- **Deployer Address:** `0xd888dE97400eFe6FeB15e08d71F8C6ff613A76C2`
- **Deployment Transaction:** `0x5ca86c3155d224693569f697a3e97dd41c26f9786af50ca20fe8cc0ffab1787e`
- **Deployment Status:** Successfully deployed and visible on Sepolia Etherscan.
- **Bytecode Check:** Contract bytecode found at the deployed address.
- **Signer Check:** Connected signer matches the contract's `decisionMaker` address.

## 2. Application 1 — Submission

- **Transaction Hash:** `0x304a2c04119b2ef47ab5c5a2aa40063c44bdd5243464365b4d10cf8b8ff3959a`
- **Block Number:** `11868887`
- **Receipt Status:** `1 (Success)`
- **Event:** `LoanApplicationSubmitted`
- **Application ID:** `1`
- **Applicant:** `0xd888dE97400eFe6FeB15e08d71F8C6ff613A76C2`
- **Loan Amount:** `100000`
- **Initial Status:** `Pending`
- **Event Validation:** **PASSED**

## 3. Application 1 — Approval

- **Transaction Hash:** `0xefd097cf82e6a89aeb27a3147824a9b29c139dc56b1fd0aaedbc8a4dc93ca41f`
- **Block Number:** `11914674`
- **Receipt Status:** `1 (Success)`

### Events Verified

| Event | Verified Values |
|---|---|
| `LoanApplicationStatusUpdated` | Application ID: `1`; Status: `1 (Approved)` |
| `LoanDecisionRecorded` | Loan ID: `1`; Decision: `Approved` |

- **Final Status:** `Approved`
- **Decision Recorded:** `true`
- **Event Validation:** **PASSED**

## 4. Application 2 — Submission

- **Transaction Hash:** `0xc37bbafd561bb64f2baf0ef331f905a65a7b8454de303453289339a022f09b0c`
- **Block Number:** `11914682`
- **Receipt Status:** `1 (Success)`
- **Application ID:** `2`
- **Applicant:** `0xd888dE97400eFe6FeB15e08d71F8C6ff613A76C2`
- **Loan Amount:** `100000`
- **Initial Status:** `Pending`
- **Registration Validation:** **PASSED**

## 5. Application 2 — Rejection

- **Transaction Hash:** `0x954cf37a83d1495ed73cf19ccadf14ad219cd08572ff20183fc2283c20bc70a4`
- **Block Number:** `11914702`
- **Receipt Status:** `1 (Success)`

### Events Verified

| Event | Verified Values |
|---|---|
| `LoanApplicationStatusUpdated` | Application ID: `2`; Status: `2 (Rejected)` |
| `LoanDecisionRecorded` | Loan ID: `2`; Decision: `Rejected` |

- **Final Status:** `Rejected`
- **Decision Recorded:** `true`
- **Event Validation:** **PASSED**

## 6. Final On-Chain State Verification

The `verify-sepolia-state.ts` script confirmed the following state by querying the deployed contract:

| Check | Application 1 | Application 2 |
|---|---|---|
| Application Exists | `true` | `true` |
| Loan Amount | `100000` | `100000` |
| Final Status | `1 (Approved)` | `2 (Rejected)` |
| Decision Recorded | `true` | `true` |

- **Application Counter:** `2`
- **Contract Address / Bytecode:** Verified
- **Final State Validation:** **PASSED**

## 7. Overall Validation Result

The `verify-sepolia-events.ts` script successfully verified all three transaction receipts and decoded the expected contract events.

- [x] Application submission event verified.
- [x] Application 1 approval status update verified.
- [x] Application 1 decision event verified.
- [x] Application 2 submission transaction recorded successfully.
- [x] Application 2 rejection status update verified.
- [x] Application 2 decision event verified.
- [x] Final on-chain statuses match the recorded decisions.

**Overall Result: ALL SEPOLIA EVENT AND STATE VALIDATIONS PASSED.**

## 8. Notes

- Status enum values used by the contract: `0 = Pending`, `1 = Approved`, `2 = Rejected`.
- The Hardhat run displayed a deprecation warning for `hre.network.connect()`. This warning did not prevent the verification script from completing successfully.
- No new deployment was required for these validations.