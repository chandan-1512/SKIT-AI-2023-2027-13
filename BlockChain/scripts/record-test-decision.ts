
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
  const currentStatus = await contract.getLoanApplicationStatus(1);
  const alreadyRecorded = await contract.decisionExists(1);

  if (signer.address.toLowerCase() !== decisionMaker.toLowerCase()) {
    throw new Error("Signer is not the authorized decision maker.");
  }

  if (currentStatus !== 0n || alreadyRecorded) {
    throw new Error(
      "Application 1 is not Pending or already has a decision. No transaction sent."
    );
  }

  console.log("Submitting Approved decision for Application 1...");

  const tx = await contract.recordLoanDecision(1, "Approved");
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("Approval transaction failed.");
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

  const finalStatus = await contract.getLoanApplicationStatus(1);
  const decisionExists = await contract.decisionExists(1);

  console.log("Final application status:", finalStatus.toString());
  console.log("Decision recorded on-chain:", decisionExists);

  if (
    !statusUpdated ||
    !decisionRecorded ||
    finalStatus !== 1n ||
    !decisionExists
  ) {
    throw new Error("Approval event or final-state validation failed.");
  }

  console.log("Approval event logging validation: PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
