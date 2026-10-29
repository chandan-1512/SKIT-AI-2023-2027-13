/**
 * contractService.js — Thin ethers v6 wrapper for LoanDecisionRegistry.
 *
 * Usage:
 *   import { getReadContract, getWriteContract } from './contractService';
 *
 *   // Read-only (no signer needed)
 *   const contract = getReadContract(provider);
 *   const status   = await contract.getLoanApplicationStatus(appId);
 *
 *   // Write (requires signer from connected MetaMask)
 *   const contract = await getWriteContract(provider);
 *   const tx       = await contract.registerLoanApplication(amountWei);
 *   const receipt  = await tx.wait();
 *
 * Contract address is read from VITE_CONTRACT_ADDRESS in .env.
 * Sprint 4 — Task 2: Contract Integration
 */

import { Contract } from 'ethers';
import ABI from '../abi/LoanDecisionRegistry.json';

/** The deployed contract address — set VITE_CONTRACT_ADDRESS in .env */
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// ─── LoanStatus enum mirrors the Solidity enum ──────────────────────────────

/** @enum {number} Maps the Solidity LoanStatus enum to a JS constant. */
export const LoanStatus = {
  Pending:  0,
  Approved: 1,
  Rejected: 2,
};

/** Reverse map: number → human-readable label */
export const LOAN_STATUS_LABEL = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected',
};

// ─── Factory helpers ─────────────────────────────────────────────────────────

/**
 * Returns a read-only Contract instance.
 * Use this for view/pure calls that don't need a wallet signature.
 *
 * @param {import('ethers').BrowserProvider} provider
 * @returns {import('ethers').Contract}
 */
export function getReadContract(provider) {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    throw new Error(
      'VITE_CONTRACT_ADDRESS is not set. Add it to your .env file and restart the dev server.'
    );
  }
  return new Contract(CONTRACT_ADDRESS, ABI.abi, provider);
}

/**
 * Returns a signed Contract instance (for state-changing transactions).
 * Resolves the signer from the connected MetaMask wallet.
 *
 * @param {import('ethers').BrowserProvider} provider
 * @returns {Promise<import('ethers').Contract>}
 */
export async function getWriteContract(provider) {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    throw new Error(
      'VITE_CONTRACT_ADDRESS is not set. Add it to your .env file and restart the dev server.'
    );
  }
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, ABI.abi, signer);
}

// ─── Error classifier ────────────────────────────────────────────────────────

/**
 * Classify an ethers / MetaMask error into a user-friendly message.
 *
 * @param {unknown} err
 * @returns {{ message: string, isUserRejection: boolean, isTimeout: boolean }}
 */
export function classifyContractError(err) {
  // User rejected the MetaMask popup
  if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') {
    return { message: 'Transaction cancelled.', isUserRejection: true, isTimeout: false };
  }
  // EVM revert (contract require() failed)
  if (err?.code === 'CALL_EXCEPTION' || err?.reason) {
    return {
      message: `Contract error: ${err.reason ?? err.message}`,
      isUserRejection: false,
      isTimeout: false,
    };
  }
  // Insufficient funds
  if (err?.code === 'INSUFFICIENT_FUNDS') {
    return {
      message: 'Insufficient ETH to cover gas. Top up your wallet.',
      isUserRejection: false,
      isTimeout: false,
    };
  }
  // Oracle poll timeout (custom error thrown by useContractOracle)
  if (err?.message?.includes('timed out')) {
    return { message: err.message, isUserRejection: false, isTimeout: true };
  }
  return {
    message: err?.message ?? 'An unexpected error occurred.',
    isUserRejection: false,
    isTimeout: false,
  };
}
