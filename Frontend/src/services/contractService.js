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
 * Sprint 4 — Task 4: Richer error classifier (nonce, underpriced gas, network mismatch)
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
 * Covers all error scenarios documented in Sprint 4:
 *   • Wallet not connected / wrong network (guards in callers — not thrown here)
 *   • User rejected MetaMask popup (code 4001 / ACTION_REJECTED)
 *   • Transaction failed on-chain (CALL_EXCEPTION / revert reason)
 *   • Oracle timeout (custom Error thrown by useContractOracle)
 *   • Insufficient funds for gas
 *   • Nonce too low (stuck tx)
 *   • Gas underpriced
 *   • Network mismatch (sent to wrong chain)
 *   • RPC / provider errors
 *   • VITE_CONTRACT_ADDRESS not set
 *
 * @param {unknown} err
 * @returns {{ message: string, isUserRejection: boolean, isTimeout: boolean, isFatal: boolean }}
 */
export function classifyContractError(err) {
  // ── User rejected the MetaMask popup ─────────────────────────────────────
  if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') {
    return {
      message: 'Transaction cancelled — you rejected the MetaMask request.',
      isUserRejection: true,
      isTimeout: false,
      isFatal: false,
    };
  }

  // ── EVM revert (contract require() / revert failed) ───────────────────────
  if (err?.code === 'CALL_EXCEPTION') {
    const reason = err?.reason ?? err?.data?.message ?? err?.message ?? 'unknown reason';
    return {
      message: `Transaction reverted: ${reason}`,
      isUserRejection: false,
      isTimeout: false,
      isFatal: false,
    };
  }

  // ── Insufficient funds for gas ─────────────────────────────────────────────
  if (
    err?.code === 'INSUFFICIENT_FUNDS' ||
    err?.message?.toLowerCase().includes('insufficient funds')
  ) {
    return {
      message: 'Insufficient ETH to cover gas fees. Top up your Sepolia wallet.',
      isUserRejection: false,
      isTimeout: false,
      isFatal: false,
    };
  }

  // ── Nonce too low / replacement underpriced ───────────────────────────────
  if (
    err?.code === 'NONCE_EXPIRED' ||
    err?.message?.toLowerCase().includes('nonce too low') ||
    err?.message?.toLowerCase().includes('replacement transaction underpriced')
  ) {
    return {
      message: 'Transaction nonce error — you may have a pending tx. ' +
               'Speed up or cancel the pending transaction in MetaMask.',
      isUserRejection: false,
      isTimeout: false,
      isFatal: false,
    };
  }

  // ── Gas underpriced ───────────────────────────────────────────────────────
  if (
    err?.code === 'UNPREDICTABLE_GAS_LIMIT' ||
    err?.message?.toLowerCase().includes('gas') ||
    err?.message?.toLowerCase().includes('underpriced')
  ) {
    return {
      message: 'Gas estimation failed — the transaction may revert or gas is too low. ' +
               'Try again with a higher gas limit.',
      isUserRejection: false,
      isTimeout: false,
      isFatal: false,
    };
  }

  // ── Network mismatch ──────────────────────────────────────────────────────
  if (
    err?.code === 'NETWORK_ERROR' ||
    err?.message?.toLowerCase().includes('network')
  ) {
    return {
      message: 'Network error — ensure your wallet is on Sepolia and retry.',
      isUserRejection: false,
      isTimeout: false,
      isFatal: false,
    };
  }

  // ── Oracle poll timeout (thrown by useContractOracle) ─────────────────────
  if (err?.message?.includes('timed out') || err?.message?.includes('Oracle')) {
    return {
      message: err.message,
      isUserRejection: false,
      isTimeout: true,
      isFatal: false,
    };
  }

  // ── Missing contract address (dev config error) ───────────────────────────
  if (err?.message?.includes('VITE_CONTRACT_ADDRESS')) {
    return {
      message: 'Contract address not configured. Set VITE_CONTRACT_ADDRESS in your .env file.',
      isUserRejection: false,
      isTimeout: false,
      isFatal: true,
    };
  }

  // ── RPC / provider error (timeout, rate limit, etc.) ─────────────────────
  if (err?.code === 'SERVER_ERROR' || err?.code === -32603) {
    return {
      message: 'RPC provider error — the node may be overloaded. Try again in a moment.',
      isUserRejection: false,
      isTimeout: false,
      isFatal: false,
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return {
    message: err?.reason ?? err?.message ?? 'An unexpected error occurred.',
    isUserRejection: false,
    isTimeout: false,
    isFatal: false,
  };
}

