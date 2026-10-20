import { network } from "hardhat";

const CONTRACT_ADDRESS =
  "0xc7E21E406ECB753eD0b9caB836601057a0577eD8";

const TRANSACTION_BLOCKS = [
  11868887, // Application 1 submission
  11914674, // Application 1 approval
  11914682, // Application 2 submission
  11914702, // Application 2 rejection
];

async function main() {
  const { ethers } = await network.connect();
  const provider = ethers.provider;
  const networkInfo = await provider.getNetwork();

  if (networkInfo.chainId !== 11155111n) {
    throw new Error("Wrong network. Expected Ethereum Sepolia.");
  }

  const contract = await ethers.getContractAt(
    "LoanDecisionRegistry",
    CONTRACT_ADDRESS
  );

  const bytecode = await provider.getCode(CONTRACT_ADDRESS);
  if (bytecode === "0x") {
    throw new Error("Contract bytecode not found.");
  }

  console.log("=== Sepolia Event Logger ===");
  console.log("Network: Ethereum Sepolia");
  console.log("Chain ID:", networkInfo.chainId.toString());
  console.log("Contract:", CONTRACT_ADDRESS);

  const filters = [
    contract.filters.LoanApplicationSubmitted(),
    contract.filters.LoanApplicationStatusUpdated(),
    contract.filters.LoanDecisionRecorded(),
  ];

  // Read only the blocks containing the four known transactions.
  for (const blockNumber of TRANSACTION_BLOCKS) {
    console.log(`\nScanning block ${blockNumber}`);

    for (const filter of filters) {
      const logs = await contract.queryFilter(
        filter,
        blockNumber,
        blockNumber
      );

      for (const log of logs) {
        if (!("fragment" in log)) continue;

        console.log("\n--- Historical Event ---");
        console.log("Event:", log.fragment.name);
        console.log("Transaction:", log.transactionHash);
        console.log("Block:", log.blockNumber);

        const parsed = contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });

        if (parsed) {
          for (let i = 0; i < parsed.fragment.inputs.length; i++) {
            const name = parsed.fragment.inputs[i].name || `arg${i}`;
            console.log(`${name}:`, String(parsed.args[i]));
          }
        }
      }
    }
  }

  console.log("\nHistorical event scan complete.");
  console.log("Listening for new events. Press Ctrl+C to stop.");

  contract.on(
    contract.filters.LoanApplicationSubmitted(),
    (applicationId, applicant, loanAmount, timestamp, event) => {
      console.log("\n[LIVE] LoanApplicationSubmitted");
      console.log("Application ID:", String(applicationId));
      console.log("Applicant:", String(applicant));
      console.log("Loan amount:", String(loanAmount));
      console.log("Timestamp:", String(timestamp));
      console.log("Transaction:", event.transactionHash);
      console.log("Block:", event.blockNumber);
    }
  );

  contract.on(
    contract.filters.LoanApplicationStatusUpdated(),
    (applicationId, status, timestamp, event) => {
      console.log("\n[LIVE] LoanApplicationStatusUpdated");
      console.log("Application ID:", String(applicationId));
      console.log("Status:", String(status));
      console.log("Timestamp:", String(timestamp));
      console.log("Transaction:", event.transactionHash);
      console.log("Block:", event.blockNumber);
    }
  );

  contract.on(
    contract.filters.LoanDecisionRecorded(),
    (loanId, decision, timestamp, event) => {
      console.log("\n[LIVE] LoanDecisionRecorded");
      console.log("Loan ID:", String(loanId));
      console.log("Decision:", String(decision));
      console.log("Timestamp:", String(timestamp));
      console.log("Transaction:", event.transactionHash);
      console.log("Block:", event.blockNumber);
    }
  );
}

main().catch((error) => {
  console.error("\nEvent logger failed:");
  console.error(error);
  process.exitCode = 1;
});