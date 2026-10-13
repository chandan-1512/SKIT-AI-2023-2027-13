import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(address);

  console.log("Network: Sepolia");
  console.log("Deployer:", address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("Deployer wallet has 0 Sepolia ETH");
  }

  console.log("✅ Deployer wallet is funded and ready.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});