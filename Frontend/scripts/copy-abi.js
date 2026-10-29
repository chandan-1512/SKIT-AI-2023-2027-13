/**
 * copy-abi.js — Copies the Hardhat-compiled LoanDecisionRegistry ABI into the
 * Frontend src/abi/ directory so the frontend always uses the canonical ABI.
 *
 * Usage:
 *   node scripts/copy-abi.js
 *
 * Run automatically via:
 *   npm run copy-abi            (one-shot)
 *   npm run dev                 (runs copy-abi first, then starts Vite)
 *
 * The source path is relative to the monorepo root. If you rename the contract
 * or move the BlockChain directory, update SRC_PATH below.
 *
 * Sprint 4 — Task 2
 */

import { cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

// Path to the Hardhat-generated artifact JSON (relative to this script)
const SRC_PATH = join(
  __dir,
  '../../BlockChain/artifacts/contracts/LoanDecisionRegistry.sol/LoanDecisionRegistry.json'
);

// Destination inside the Frontend src tree
const DEST_DIR  = join(__dir, '../src/abi');
const DEST_PATH = join(DEST_DIR, 'LoanDecisionRegistry.json');

if (!existsSync(SRC_PATH)) {
  console.warn(
    `⚠️  Hardhat artifact not found at:\n   ${SRC_PATH}\n` +
    '   Run "npm run compile" in BlockChain/ first, then retry.\n' +
    '   Falling back to existing src/abi/LoanDecisionRegistry.json (if present).'
  );
  process.exit(0); // non-fatal — existing hand-crafted ABI remains in place
}

mkdirSync(DEST_DIR, { recursive: true });
cpSync(SRC_PATH, DEST_PATH);
console.log(`✅  ABI copied:\n   ${SRC_PATH}\n → ${DEST_PATH}`);
