import "dotenv/config";
import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],

  solidity: {
    version: "0.8.34",
  },

  networks: {
  sepolia: {
    type: "http",
    url: process.env.SEPOLIA_RPC_URL!,
    accounts: process.env.SEPOLIA_PRIVATE_KEY
      ? [process.env.SEPOLIA_PRIVATE_KEY]
      : [],
  },
},
});