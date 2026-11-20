
import "dotenv/config";
import { Web3 } from "web3";
import { connectReadOnly } from "../services/blockchainService.js";

async function createTestApplication() {
  try {
    const privateKey = process.env.SEPOLIA_PRIVATE_KEY?.trim();

    if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error("Valid SEPOLIA_PRIVATE_KEY is required.");
    }

    const { web3, contract, contractAddress } =
      await connectReadOnly();

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    const from = account.address;

    const previousCount = Number(
      await contract.methods.getApplicationCounter().call()
    );

    // Test application amount: 1 ETH expressed in Wei.
    // This is only a stored loan amount, not an ETH transfer.
    const testLoanAmount = web3.utils.toWei("1", "ether");

    const method = contract.methods.registerLoanApplication(
      testLoanAmount
    );

    const [nonce, gasPrice, estimatedGas] = await Promise.all([
      web3.eth.getTransactionCount(from, "pending"),
      web3.eth.getGasPrice(),
      method.estimateGas({ from }),
    ]);

    const transaction = {
      from,
      to: contractAddress,
      data: method.encodeABI(),
      nonce,
      gas: (BigInt(estimatedGas) * 120n / 100n).toString(),
      gasPrice: gasPrice.toString(),
      chainId: 11155111,
    };

    const signed = await web3.eth.accounts.signTransaction(
      transaction,
      privateKey
    );

    const receipt = await web3.eth.sendSignedTransaction(
      signed.rawTransaction
    );

    if (Number(receipt.status) !== 1) {
      throw new Error("Application registration transaction failed.");
    }

    const newCount = Number(
      await contract.methods.getApplicationCounter().call()
    );

    if (newCount !== previousCount + 1) {
      throw new Error("Could not verify the newly created application ID.");
    }

    const applicationId = newCount;

    const summary = await contract.methods
      .getApplicationSummary(applicationId)
      .call();

    console.log("\n===== TEST APPLICATION CREATED =====");
    console.log("Application ID:", applicationId);
    console.log("Applicant:", summary[1]);
    console.log("Current status:", Number(summary[3]) === 0 ? "Pending" : summary[3]);
    console.log("Transaction:", receipt.transactionHash);
    console.log("Block:", Number(receipt.blockNumber));
    console.log("\nSave this Application ID for the next step.");

  } catch (error) {
    console.error("Test application creation failed:", error.message);
    process.exitCode = 1;
  }
}

createTestApplication();