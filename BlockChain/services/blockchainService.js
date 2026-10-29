import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Web3 } from "web3";

const SERVICE_DIR = path.dirname(fileURLToPath(import.meta.url));
const BLOCKCHAIN_DIR = path.resolve(SERVICE_DIR, "..");

const ARTIFACT_PATH = path.join(
  BLOCKCHAIN_DIR,
  "artifacts",
  "contracts",
  "LoanDecisionRegistry.sol",
  "LoanDecisionRegistry.json"
);

export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACT_ADDRESS =
  process.env.LOAN_DECISION_REGISTRY_ADDRESS ||
  "0xc7E21E406ECB753eD0b9caB836601057a0577eD8";

export const APPLICATION_STATUS = Object.freeze({
  0: "Pending",
  1: "Approved",
  2: "Rejected",
});

export function validateApplicationId(id) {
  if (
    typeof id !== "number" &&
    typeof id !== "string" &&
    typeof id !== "bigint"
  ) {
    throw new TypeError("Application ID must be a positive integer.");
  }

  const value = String(id);

  if (!/^[1-9]\d*$/.test(value)) {
    throw new TypeError("Application ID must be a positive integer.");
  }

  return value;
}

export function validateAddress(address) {
  if (typeof address !== "string" || !Web3.utils.isAddress(address)) {
    throw new TypeError("A valid Ethereum address is required.");
  }

  return Web3.utils.toChecksumAddress(address);
}

export function mapApplicationStatus(status) {
  const value = Number(status);
  const mapped = APPLICATION_STATUS[value];

  if (mapped === undefined) {
    throw new Error('Unknown loan application status: ${status}');
  }

  return mapped;
}

function loadContractAbi() {
  if (!fs.existsSync(ARTIFACT_PATH)) {
    throw new Error(
      'Contract artifact not found: ${ARTIFACT_PATH}. Compile the contract first.'
    );
  }

  const artifact = JSON.parse(
    fs.readFileSync(ARTIFACT_PATH, "utf8")
  );

  if (!Array.isArray(artifact.abi) || artifact.abi.length === 0) {
    throw new Error("Contract artifact does not contain a valid ABI.");
  }

  return artifact.abi;
}

function createWeb3() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;

  if (!rpcUrl) {
    throw new Error(
      "SEPOLIA_RPC_URL is missing from the BlockChain .env file."
    );
  }

  return new Web3(rpcUrl);
}

/**
 * Connects to Sepolia and verifies the deployed contract.
 * This service performs read-only blockchain operations.
 * No private key or signer is required.
 */
export async function connectReadOnly() {
  if (!Web3.utils.isAddress(CONTRACT_ADDRESS)) {
    throw new Error("Contract address is invalid.");
  }

  const web3 = createWeb3();
  const chainId = Number(await web3.eth.getChainId());

  if (chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(
      'Wrong network: expected Sepolia (${SEPOLIA_CHAIN_ID}), received ${chainId}.'
    );
  }

  const contractAddress =
    Web3.utils.toChecksumAddress(CONTRACT_ADDRESS);

  const bytecode = await web3.eth.getCode(contractAddress);

  if (!bytecode || /^0x0*$/i.test(bytecode)) {
    throw new Error(
      'No deployed contract bytecode found at ${contractAddress}.'
    );
  }

  const abi = loadContractAbi();
  const contract = new web3.eth.Contract(abi, contractAddress);

  return {
    web3,
    contract,
    chainId,
    contractAddress,
  };
}

export async function getApplicationCounter() {
  const { contract } = await connectReadOnly();

  const count = await contract.methods
    .getApplicationCounter()
    .call();

  return Number(count);
}

export async function getApplicationSummary(applicationId) {
  const id = validateApplicationId(applicationId);
  const { contract } = await connectReadOnly();

  const exists = await contract.methods
    .applicationExists(id)
    .call();

  if (!exists) {
    throw new Error('Loan application ${id} does not exist.');
  }

  const result = await contract.methods
    .getApplicationSummary(id)
    .call();
    return {
    applicationId: Number(result[0]),
    applicant: result[1],
    loanAmount: result[2].toString(),
    statusCode: Number(result[3]),
    status: mapApplicationStatus(result[3]),
    appliedAt: Number(result[4]),
    hasDecision: Boolean(result[5]),
  };
}

export async function getApplicationStatus(applicationId) {
  const summary = await getApplicationSummary(applicationId);

  return {
    applicationId: summary.applicationId,
    statusCode: summary.statusCode,
    status: summary.status,
    hasDecision: summary.hasDecision,
  };
}

export async function getApplicantApplications(address) {
  const applicant = validateAddress(address);
  const { contract } = await connectReadOnly();

  const ids = await contract.methods
    .getApplicantApplications(applicant)
    .call();

  const applications = [];

  for (const id of ids) {
    const summary = await getApplicationSummary(id.toString());
    applications.push(summary);
  }

  return applications;
}