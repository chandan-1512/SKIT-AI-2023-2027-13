# Sepolia Deployment

## Network
Ethereum Sepolia

## Contract
LoanDecisionRegistry

## Contract Address
0xc7E21E406ECB753eD0b9caB836601057a0577eD8

## Deployer Address
0xd888dE97400eFe6FeB15e08d71F8C6ff613A76C2

## Deployment Status
Successfully deployed and visible on Sepolia Etherscan.

## Deployment Transaction
0x5ca86c3155d224693569f697a3e97dd41c26f9786af50ca20fe8cc0ffab1787e

## Verification
The contract creator shown on Sepolia Etherscan matches the configured deployer address.

## Sepolia Contract Interaction Validation

### Loan Application Transaction
- Function: `registerLoanApplication(100000)`
- Transaction Hash: `0x304a2c04119b2ef47ab5c5a2aa40063c44bdd5243464365b4d10cf8b8ff3959a`
- Transaction Status: `1 (Success)`
- Block Number: `11868887`

### State Verification
- Application Counter before transaction: `0`
- Application Counter after transaction: `1`
- Application ID: `1`
- Applicant: `0xd888dE97400eFe6FeB15e08d71F8C6ff613A76C2`
- Loan Amount: `100000`
- Initial Status: `Pending`