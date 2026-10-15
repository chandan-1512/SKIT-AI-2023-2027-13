
import { network } from "hardhat";

const CONTRACT_ADDRESS =
  "0xc7E21E406ECB753eD0b9caB836601057a0577eD8";

async function main() {
  const { ethers } = await network.connect();

  const code = await ethers.provider.getCode(CONTRACT_ADDRESS);

  if (code === "0x") {
    throw new Error(
      "No contract bytecode found at the configured address."
    );
  }

  const contract = await ethers.getContractAt(
    "LoanDecisionRegistry",
    CONTRACT_ADDRESS
  );

  const counter = await contract.getApplicationCounter();
  const exists = await contract.applicationExists(1);
  const decisionRecorded = await contract.decisionExists(1);
  const decisionMaker = await contract.decisionMaker();

  console.log("Network: Sepolia");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Bytecode found:", true);
  console.log("Application counter:", counter.toString());
  console.log("Application 1 exists:", exists);
  console.log("Decision recorded:", decisionRecorded);
  console.log("Decision maker:", decisionMaker);
  console.log("Connected signer:", (await ethers.getSigners())[0].address);


  if (exists) {
    const application = await contract.getLoanApplication(1);

    console.log("Application ID:", application[0].toString());
    console.log("Applicant:", application[1]);
    console.log("Loan amount:", application[2].toString());
    console.log("Status:", application[3].toString());
    console.log("Applied at:", application[4].toString());
  }
  const app2Exists = await contract.applicationExists(2);
console.log("Application 2 exists:", app2Exists);

if (app2Exists) {
  const app2 = await contract.getLoanApplication(2);
  console.log("Application 2 ID:", app2[0].toString());
  console.log("Application 2 applicant:", app2[1]);
  console.log("Application 2 amount:", app2[2].toString());
  console.log("Application 2 status:", app2[3].toString());
  console.log("Application 2 decision recorded:", await contract.decisionExists(2));
}

  if (!exists || counter < 1n) {
    throw new Error(
      "Expected existing application 1 was not found."
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
