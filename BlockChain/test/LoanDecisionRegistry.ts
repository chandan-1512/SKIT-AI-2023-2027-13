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

  it("should register a loan application", async function () {
    const { ethers } = await network.connect();

    const LoanDecisionRegistry = await ethers.getContractFactory(
      "LoanDecisionRegistry"
    );

    const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

    const [applicant] = await ethers.getSigners();
    const loanAmount = 50000;

    const tx = await loanDecisionRegistry.registerLoanApplication(
      loanAmount
    );

    await tx.wait();

    const application = await loanDecisionRegistry.getLoanApplication(1);

    expect(application[0]).to.equal(1);
    expect(application[1]).to.equal(applicant.address);
    expect(application[2]).to.equal(loanAmount);
    expect(application[3]).to.equal(0);
    expect(application[4]).to.be.greaterThan(0);
  });
  it("should reject a loan application with zero amount", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await expect(
    loanDecisionRegistry.registerLoanApplication(0)
  ).to.be.revertedWith("Invalid loan amount");
});
it("should emit LoanApplicationSubmitted event", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  const [applicant] = await ethers.getSigners();
  const loanAmount = 50000;

  await expect(
    loanDecisionRegistry.registerLoanApplication(loanAmount)
  )
    .to.emit(loanDecisionRegistry, "LoanApplicationSubmitted")
    .withArgs(
      1,
      applicant.address,
      loanAmount,
      (value: bigint) => value > 0
    );
});
it("should assign unique IDs to multiple loan applications", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);
  await loanDecisionRegistry.registerLoanApplication(75000);

  expect(
    await loanDecisionRegistry.getApplicationCounter()
  ).to.equal(2);

  const firstApplication =
    await loanDecisionRegistry.getLoanApplication(1);

  const secondApplication =
    await loanDecisionRegistry.getLoanApplication(2);

  expect(firstApplication[0]).to.equal(1);
  expect(firstApplication[2]).to.equal(50000);

  expect(secondApplication[0]).to.equal(2);
  expect(secondApplication[2]).to.equal(75000);
});
it("should reject retrieval of a non-existent loan application", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await expect(
    loanDecisionRegistry.getLoanApplication(999)
  ).to.be.revertedWith("Loan application not found");
});
});