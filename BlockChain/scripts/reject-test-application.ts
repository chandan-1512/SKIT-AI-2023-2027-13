
import { network } from "hardhat";

const CONTRACT_ADDRESS =
  "0xc7E21E406ECB753eD0b9caB836601057a0577eD8";

async function main() {
  const { ethers } = await network.connect();
  const [signer] = await ethers.getSigners();

  if (!signer) {
    throw new Error("No configured Sepolia signer found.");
  }

  const contract = await ethers.getContractAt(
    "LoanDecisionRegistry",
    CONTRACT_ADDRESS,
    signer
  );

  const decisionMaker = await contract.decisionMaker();
  const status = await contract.getLoanApplicationStatus(2);
  const recorded = await contract.decisionExists(2);

  if (signer.address.toLowerCase() !== decisionMaker.toLowerCase()) {
    throw new Error("Signer is not the authorized decision maker.");
  }

  if (status !== 0n || recorded) {
    throw new Error("Application 2 is not Pending or already has a decision.");
  }

  const tx = await contract.recordLoanDecision(2, "Rejected");
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("Rejection transaction failed.");
  }

  const events = receipt.logs
    .filter(
      (log) =>
        log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
    )
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .filter((event) => event !== null);

  console.log("Transaction status:", receipt.status);
  console.log("Block number:", receipt.blockNumber);

  for (const event of events) {
    console.log("Event:", event.name);
    console.log("Arguments:", event.args.toObject());
  }

  const statusUpdated = events.some(
    (event) => event.name === "LoanApplicationStatusUpdated"
  );
  const decisionRecorded = events.some(
    (event) => event.name === "LoanDecisionRecorded"
  );

  const finalStatus = await contract.getLoanApplicationStatus(2);
  const decisionExists = await contract.decisionExists(2);

  console.log("Final application status:", finalStatus.toString());
  console.log("Decision recorded on-chain:", decisionExists);

  if (
    !statusUpdated ||
    !decisionRecorded ||
    finalStatus !== 2n ||
    !decisionExists
  ) {
    throw new Error("Rejection event or final-state validation failed.");
  }

  console.log("Rejection event logging validation: PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
