import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();

  console.log("Deploying LoanDecisionRegistry...");
  console.log("Deployer:", await deployer.getAddress());

  const LoanDecisionRegistry =
    await ethers.getContractFactory("LoanDecisionRegistry");

  const contract = await LoanDecisionRegistry.deploy();

  await contract.waitForDeployment();

  console.log(
    "LoanDecisionRegistry prepared at:",
    await contract.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});