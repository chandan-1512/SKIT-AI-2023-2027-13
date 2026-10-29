/**
 * useContractOracle.js — Custom hook that drives the on-chain oracle round-trip.
 *
 * Flow:
 *   Step 0 (REQUESTING)  → submit registerLoanApplication(amountWei) tx
 *   Step 1 (AWAITING)    → wait 15–30+ s for oracle/decisionMaker to call recordLoanDecision
 *   Step 2 (RECEIVED)    → LoanApplicationStatusUpdated event detected (status ≠ Pending)
 *   Step 3 (CONFIRM)     → resolved; caller receives { appId, status, decision }
 *
 * Error handling:
 *   • Wallet not connected / wrong network → throws before touching chain
 *   • User rejects MetaMask popup → code 4001
 *   • Oracle poll timeout after ORACLE_TIMEOUT_MS → throws 'Oracle timed out'
 *
 * Sprint 4 — Task 2: Contract Integration
 */

import { useState, useCallback, useRef } from 'react';
import { parseUnits } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { getWriteContract, getReadContract, LoanStatus, LOAN_STATUS_LABEL, classifyContractError } from '../services/contractService';
import {
  ORACLE_STEP_REQUESTING,
  ORACLE_STEP_AWAITING,
  ORACLE_STEP_RECEIVED,
  ORACLE_STEP_CONFIRM,
} from '../config/loanConfig';

/** How long to poll before giving up (ms). Sepolia blocks ~12 s; allow 90 s. */
const ORACLE_TIMEOUT_MS = 90_000;
/** Poll interval (ms). */
const POLL_INTERVAL_MS  = 4_000;

/**
 * @typedef {{
 *   appId:    bigint,
 *   status:   number,       // 0=Pending, 1=Approved, 2=Rejected
 *   decision: string,       // 'Approved' | 'Rejected'
 * }} OracleResult
 */

/**
 * useContractOracle — drives the full on-chain loan application + oracle wait.
 *
 * @returns {{
 *   oracleStep:  number,          // -1 = not started; 0–3 = step index
 *   isRunning:   boolean,
 *   error:       string | null,
 *   txHash:      string | null,   // submission tx hash (for explorer link)
 *   runOracle:   (amountEth: number) => Promise<OracleResult | null>
 *   reset:       () => void,
 * }}
 */
export function useContractOracle() {
  const { isConnected, isCorrectNetwork, provider } = useWallet();

  const [oracleStep, setOracleStep] = useState(-1);
  const [isRunning,  setIsRunning]  = useState(false);
  const [error,      setError]      = useState(null);
  const [txHash,     setTxHash]     = useState(null);

  // Abort signal so the component can cancel polling on unmount
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current = true; // stop any in-flight poll
    setOracleStep(-1);
    setIsRunning(false);
    setError(null);
    setTxHash(null);
    // Re-arm for next run
    setTimeout(() => { abortRef.current = false; }, 0);
  }, []);

  /**
   * Submit registerLoanApplication and poll for oracle decision.
   * Returns OracleResult on success, null if aborted/errored.
   *
   * @param {number} amountEth  — loan amount as a decimal ETH string / number
   * @returns {Promise<OracleResult | null>}
   */
  const runOracle = useCallback(async (amountEth) => {
    // ── Guard: wallet preconditions ────────────────────────────────────────
    if (!isConnected) {
      setError('Connect your wallet before submitting a loan application.');
      return null;
    }
    if (!isCorrectNetwork) {
      setError('Switch to Sepolia (or local Hardhat) to interact with the contract.');
      return null;
    }

    abortRef.current = false;
    setError(null);
    setTxHash(null);
    setIsRunning(true);

    try {
      // ── Step 0: Submit tx ───────────────────────────────────────────────
      setOracleStep(ORACLE_STEP_REQUESTING);

      const writeContract = await getWriteContract(provider);

      // The contract stores raw uint256; we pass the amount in "wei" units
      // (1 ETH = 1e18 wei). Using parseUnits with 18 decimals.
      const amountWei = parseUnits(String(amountEth), 18);

      const tx = await writeContract.registerLoanApplication(amountWei);
      setTxHash(tx.hash);

      // Wait for the tx to be mined (1 confirmation)
      const receipt = await tx.wait(1);

      // Extract applicationId from LoanApplicationSubmitted in the receipt
      let appId = null;
      const iface = writeContract.interface;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data });
          if (parsed?.name === 'LoanApplicationSubmitted') {
            appId = parsed.args.applicationId; // BigInt
            break;
          }
        } catch {
          // not a log we care about
        }
      }

      if (appId === null) {
        throw new Error('Could not read applicationId from transaction receipt.');
      }

      // ── Step 1: Wait for oracle round-trip ─────────────────────────────
      setOracleStep(ORACLE_STEP_AWAITING);

      const readContract = getReadContract(provider);
      const deadline     = Date.now() + ORACLE_TIMEOUT_MS;

      let finalStatus = LoanStatus.Pending;

      while (Date.now() < deadline) {
        if (abortRef.current) return null; // component unmounted / user reset

        const statusRaw = await readContract.getLoanApplicationStatus(appId);
        finalStatus = Number(statusRaw);

        if (finalStatus !== LoanStatus.Pending) break; // oracle responded

        await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
      }

      if (finalStatus === LoanStatus.Pending) {
        throw new Error(
          'Oracle timed out — the decision maker has not responded within 90 seconds. ' +
          'Please try again or contact support.'
        );
      }

      // ── Step 2: Decision received ──────────────────────────────────────
      setOracleStep(ORACLE_STEP_RECEIVED);

      const decision = LOAN_STATUS_LABEL[finalStatus] ?? 'Unknown';

      // Short pause so the UI shows step 2 before jumping to confirm
      await new Promise((res) => setTimeout(res, 500));

      // ── Step 3: Confirm ────────────────────────────────────────────────
      setOracleStep(ORACLE_STEP_CONFIRM);
      setIsRunning(false);

      return { appId, status: finalStatus, decision };

    } catch (err) {
      if (abortRef.current) return null; // ignore errors after reset

      const { message } = classifyContractError(err);
      setError(message);
      setOracleStep(-1);
      setIsRunning(false);
      return null;
    }
  }, [isConnected, isCorrectNetwork, provider]);

  return { oracleStep, isRunning, error, txHash, runOracle, reset };
}
