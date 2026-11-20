
import "dotenv/config";
import { Web3 } from "web3";

import {
  connectReadOnly,
  getApplicationSummary,
} from "../services/blockchainService.js";

async function checkDecisionMaker() {
  try {
    const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error("SEPOLIA_PRIVATE_KEY is missing.");
    }

    const { web3, contract, chainId, contractAddress } =
      await connectReadOnly();

    const signer = web3.eth.accounts.privateKeyToAccount(privateKey);

    const signerAddress = Web3.utils.toChecksumAddress(signer.address);

    const authorizedAddress = Web3.utils.toChecksumAddress(
      await contract.methods.decisionMaker().call()
    );

    const balanceWei = await web3.eth.getBalance(signerAddress);
    const balanceEth = web3.utils.fromWei(balanceWei, "ether");

    console.log("\n========== DECISION MAKER CHECK ==========\n");

    console.log("Network:", chainId === 11155111 ? "Sepolia" : chainId);
    console.log("Contract:", contractAddress);
    console.log("Configured wallet:", signerAddress);
    console.log("Authorized wallet:", authorizedAddress);
    console.log("Wallet balance:", balanceEth, "Sepolia ETH");

    if (signerAddress !== authorizedAddress) {
      throw new Error(
        "Wallet mismatch: configured wallet is not the contract decisionMaker."
      );
    }

    console.log("\nWallet authorization: VERIFIED");

    if (BigInt(balanceWei) === 0n) {
      throw new Error("DecisionMaker wallet has zero Sepolia ETH.");
    }

    console.log("Wallet balance: FUNDED");

    const applicationId = process.argv[2];

    if (applicationId) {
      const application = await getApplicationSummary(applicationId);

      console.log("\n========== APPLICATION CHECK ==========\n");
      console.log("Application ID:", application.applicationId);
      console.log("Applicant:", application.applicant);
      console.log("Current status:", application.status);
      console.log("Existing decision:", application.hasDecision);

      if (application.hasDecision) {
        console.log(
          "Note: This application already has a decision. Do not submit another."
        );
      } else {
        console.log("Application is pending and eligible for decision.");
      }
    }

    console.log("\nPre-flight verification completed successfully.");

  } catch (error) {
    console.error("\nPre-flight verification failed:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

checkDecisionMaker();