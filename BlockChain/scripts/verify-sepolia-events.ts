import { network } from "hardhat";

const CONTRACT_ADDRESS =
  "0xc7E21E406ECB753eD0b9caB836601057a0577eD8";

const TRANSACTIONS = [
  {
    label: "Application 1 Submission",
    hash: "0x304a2c04119b2ef47ab5c5a2aa40063c44bdd5243464365b4d10cf8b8ff3959a",
    expectedEvent: "LoanApplicationSubmitted",
    applicationId: 1n,
  },
  {
    label: "Application 1 Approval",
    hash: "0xefd097cf82e6a89aeb27a3147824a9b29c139dc56b1fd0aaedbc8a4dc93ca41f",
    expectedEvent: "LoanDecisionRecorded",
    applicationId: 1n,
    expectedDecision: "Approved",
  },
  {
  label: "Application 2 Submission",
  hash: "0xc37bbafd561bb64f2baf0ef331f905a65a7b8454de303453289339a022f09b0c",
  expectedEvent: "LoanApplicationSubmitted",
  applicationId: 2n,
},
  {
    label: "Application 2 Rejection",
    hash: "0x954cf37a83d1495ed73cf19ccadf14ad219cd08572ff20183fc2283c20bc70a4",
    expectedEvent: "LoanDecisionRecorded",
    applicationId: 2n,
    expectedDecision: "Rejected",
  },
];

async function main() {
  const { ethers } = await network.connect();

  const contract = await ethers.getContractAt(
    "LoanDecisionRegistry",
    CONTRACT_ADDRESS
  );

  console.log("Network: Sepolia");
  console.log("Contract:", CONTRACT_ADDRESS);

  for (const tx of TRANSACTIONS) {
    const receipt = await ethers.provider.getTransactionReceipt(tx.hash);

    if (!receipt) {
      throw new Error(`${tx.label}: transaction receipt not found.`);
    }
    if (receipt.hash.toLowerCase() !== tx.hash.toLowerCase()) {
      throw new Error(`${tx.label}: transaction hash mismatch.`);
    }
    if (receipt.status !== 1) {
      throw new Error(`${tx.label}: transaction failed.`);
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

    console.log(`\n--- ${tx.label} ---`);
    console.log("Transaction hash:", receipt.hash);
    console.log("Receipt status:", receipt.status);
    console.log("Block number:", receipt.blockNumber);

    for (const event of events) {
      console.log("Event:", event.name);
      console.log("Arguments:", event.args.toObject());
    }

    const expected = events.find(
      (event) => event.name === tx.expectedEvent
    );

    if (!expected) {
      throw new Error(
        `${tx.label}: expected event ${tx.expectedEvent} not found.`
      );
    }

    if (tx.expectedDecision) {
      const statusEvent = events.find(
        (event) => event.name === "LoanApplicationStatusUpdated"
      );

      if (
        !statusEvent ||
        statusEvent.args.applicationId !== tx.applicationId
      ) {
        throw new Error(`${tx.label}: status update event validation failed.`);
      }

      const expectedStatus = tx.expectedDecision === "Approved" ? 1n : 2n;

      if (statusEvent.args.status !== expectedStatus) {
        throw new Error(`${tx.label}: incorrect application status.`);
      }

      if (
        expected.args.loanId !== tx.applicationId ||
        expected.args.decision !== tx.expectedDecision
      ) {
        throw new Error(`${tx.label}: decision event validation failed.`);
      }
    } else if (expected.args.applicationId !== tx.applicationId) {
      throw new Error(`${tx.label}: application ID mismatch.`);
    }

    console.log(`${tx.label} validation: PASSED`);
  }

  for (const applicationId of [1n, 2n]) {
    const status = await contract.getLoanApplicationStatus(applicationId);
    const recorded = await contract.decisionExists(applicationId);

    console.log(`\nApplication ${applicationId} final status:`, status.toString());
    console.log(`Application ${applicationId} decision recorded:`, recorded);

    if (applicationId === 1n && (status !== 1n || !recorded)) {
      throw new Error("Application 1 approval state validation failed.");
    }

    if (applicationId === 2n && (status !== 2n || !recorded)) {
      throw new Error("Application 2 rejection state validation failed.");
    }
  }

  console.log("\nAll Sepolia event and state validations: PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});