import { expect } from "chai";
import { network } from "hardhat";

describe("LoanDecisionRegistry", function () {
  it("should deploy successfully", async function () {
    const { ethers } = await network.connect();

    const LoanDecisionRegistry = await ethers.getContractFactory(
      "LoanDecisionRegistry"
    );

    const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

    expect(await loanDecisionRegistry.getAddress()).to.be.properAddress;
  });
});