
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
    throw new Error(`Unknown loan application status: ${status}`);
  }

  return mapped;
}

export function mapPredictionToDecision(prediction) {
  if (prediction !== 0 && prediction !== 1) {
    throw new TypeError(
      "Prediction must be either 0 (Rejected) or 1 (Approved)."
    );
  }

  return prediction === 1 ? "Approved" : "Rejected";
}

function loadContractAbi() {
  if (!fs.existsSync(ARTIFACT_PATH)) {
    throw new Error(
      `Contract artifact not found: ${ARTIFACT_PATH}. Compile the contract first.`
    );
  }

  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));

  if (!Array.isArray(artifact.abi) || artifact.abi.length === 0) {
    throw new Error("Contract artifact does not contain a valid ABI.");
  }

  return artifact.abi;
}

function createWeb3() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;

  if (!rpcUrl) {
    throw new Error("SEPOLIA_RPC_URL is missing from BlockChain .env.");
  }

  return new Web3(rpcUrl);
}

export async function connectReadOnly() {
  if (!Web3.utils.isAddress(CONTRACT_ADDRESS)) {
    throw new Error("Contract address is invalid.");
  }

  const web3 = createWeb3();
  const chainId = Number(await web3.eth.getChainId());

  if (chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(
      `Wrong network: expected Sepolia (${SEPOLIA_CHAIN_ID}), received ${chainId}.`
    );
  }

  const contractAddress = Web3.utils.toChecksumAddress(CONTRACT_ADDRESS);
  const bytecode = await web3.eth.getCode(contractAddress);

  if (!bytecode || /^0x0*$/i.test(bytecode)) {
    throw new Error(
      `No deployed contract bytecode found at ${contractAddress}.`
    );
  }

  const abi = loadContractAbi();
  const contract = new web3.eth.Contract(abi, contractAddress);

  return { web3, contract, chainId, contractAddress };
}

export async function getApplicationCounter() {
  const { contract } = await connectReadOnly();

  const count = await contract.methods.getApplicationCounter().call();
  return Number(count);
}

export async function getApplicationSummary(applicationId) {
  const id = validateApplicationId(applicationId);
  const { contract } = await connectReadOnly();

  const exists = await contract.methods.applicationExists(id).call();

  if (!exists) {
    throw new Error(`Loan application ${id} does not exist.`);
  }

  const result = await contract.methods.getApplicationSummary(id).call();

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
    applications.push(await getApplicationSummary(id.toString()));
  }

  return applications;
}

/**
 * Records the AI decision using the authorized decisionMaker wallet.
 * prediction: 1 = Approved, 0 = Rejected
 */
export async function recordApplicationDecision(applicationId, prediction) {
  const id = validateApplicationId(applicationId);

  const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("SEPOLIA_PRIVATE_KEY is missing from BlockChain .env.");
  }

  const decision = mapPredictionToDecision(prediction);
  const { web3, contract, chainId } = await connectReadOnly();

  const signer = web3.eth.accounts.privateKeyToAccount(privateKey);
  const signerAddress = Web3.utils.toChecksumAddress(signer.address);

  const authorizedDecisionMaker = Web3.utils.toChecksumAddress(
    await contract.methods.decisionMaker().call()
  );

  if (signerAddress !== authorizedDecisionMaker) {
    throw new Error(
      "Configured wallet is not the authorized contract decisionMaker."
    );
  }

  const summary = await getApplicationSummary(id);

  // Idempotency: do not submit a second decision for an already-decided loan.
  if (summary.hasDecision) {
    if (summary.status === decision) {
      return {
        applicationId: Number(id),
        decision,
        status: summary.status,
        alreadyRecorded: true,
        transactionHash: null,
        blockNumber: null,
      };
    }

    throw new Error(
      `Application ${id} already has a different on-chain decision: ${summary.status}.`
    );
  }

  const method = contract.methods.recordLoanDecision(id, decision);

  const [nonce, gasPrice, estimatedGas] = await Promise.all([
    web3.eth.getTransactionCount(signerAddress, "pending"),
    web3.eth.getGasPrice(),
    method.estimateGas({ from: signerAddress }),
  ]);

  const gas = (BigInt(estimatedGas) * 120n / 100n).toString();

  const transaction = {
    from: signerAddress,
    to: CONTRACT_ADDRESS,
    data: method.encodeABI(),
    nonce,
    gas,
    gasPrice: gasPrice.toString(),
    chainId,
  };

  const signedTransaction = await web3.eth.accounts.signTransaction(
    transaction,
    privateKey
  );

  if (!signedTransaction.rawTransaction) {
    throw new Error("Unable to sign blockchain transaction.");
  }

  const receipt = await web3.eth.sendSignedTransaction(
    signedTransaction.rawTransaction
  );

  if (Number(receipt.status) !== 1) {
    throw new Error("Blockchain transaction failed.");
  }

  // Verify the final decision directly from the contract.
  const verifiedSummary = await getApplicationSummary(id);

  if (
    !verifiedSummary.hasDecision ||
    verifiedSummary.status !== decision
  ) {
    throw new Error(
      "Transaction was mined, but the on-chain decision verification failed."
    );
  }

  return {
    applicationId: Number(id),
    decision,
    status: verifiedSummary.status,
    alreadyRecorded: false,
    transactionHash: receipt.transactionHash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    verified: true,
  };
}