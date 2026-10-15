
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

  const before = await contract.getApplicationCounter();

  console.log("Application counter before:", before.toString());
  console.log("Registering test application with amount 100000...");

  const tx = await contract.registerLoanApplication(100000);
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error("Application registration failed.");
  }

  const after = await contract.getApplicationCounter();

  console.log("Transaction status:", receipt.status);
  console.log("Block number:", receipt.blockNumber);
  console.log("Application counter after:", after.toString());

  if (after !== before + 1n) {
    throw new Error("Unexpected application counter.");
  }

  console.log("New application ID:", after.toString());
  console.log("Registration validation: PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
