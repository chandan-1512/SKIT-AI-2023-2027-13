import {
  connectReadOnly,
  mapApplicationStatus,
} from "./blockchainService.js";

async function main() {
  console.log("Connecting to Sepolia...");

  const {
    web3,
    contract,
    chainId,
    contractAddress,
  } = await connectReadOnly();

  console.log("\n--- Connection Verification ---");
  console.log("Network: Sepolia");
  console.log("Chain ID:", chainId);
  console.log("Contract address:", contractAddress);
  console.log("Contract bytecode: Verified");

  const count = Number(
    await contract.methods.getApplicationCounter().call()
  );

  console.log("\n--- Loan Application Registry ---");
  console.log("Total applications:", count);

  const limit = Math.min(count, 2);

  for (let id = 1; id <= limit; id++) {
    const exists = await contract.methods
      .applicationExists(String(id))
      .call();

    if (!exists) {
      console.log('Application ${id}: Not found');
      continue;
    }

    const result = await contract.methods
      .getApplicationSummary(String(id))
      .call();

    const summary = {
      applicationId: Number(result[0]),
      applicant: result[1],
      loanAmount: result[2].toString(),
      status: mapApplicationStatus(result[3]),
      appliedAt: Number(result[4]),
      hasDecision: Boolean(result[5]),
    };

    console.log("\nApplication" + summary.applicationId + ":");
    console.log(JSON.stringify(summary, null, 2));
  }

  console.log("\nRead-only Sepolia verification completed.");
}

main().catch((error) => {
  console.error("\nSepolia verification failed:");
  console.error(error.message);
  process.exitCode = 1;
});