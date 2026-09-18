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
it("should return applications for an applicant", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  const [applicant] = await ethers.getSigners();

  await loanDecisionRegistry.registerLoanApplication(50000);
  await loanDecisionRegistry.registerLoanApplication(75000);

  const applicationIds =
    await loanDecisionRegistry.getApplicantApplications(
      applicant.address
    );

  expect(applicationIds.length).to.equal(2);
  expect(applicationIds[0]).to.equal(1);
  expect(applicationIds[1]).to.equal(2);
});
it("should keep applications separate for different applicants", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  const [applicant1, applicant2] = await ethers.getSigners();

  await loanDecisionRegistry
    .connect(applicant1)
    .registerLoanApplication(50000);

  await loanDecisionRegistry
    .connect(applicant2)
    .registerLoanApplication(75000);

  const applicant1Applications =
    await loanDecisionRegistry.getApplicantApplications(
      applicant1.address
    );

  const applicant2Applications =
    await loanDecisionRegistry.getApplicantApplications(
      applicant2.address
    );

  expect(applicant1Applications.length).to.equal(1);
  expect(applicant1Applications[0]).to.equal(1);

  expect(applicant2Applications.length).to.equal(1);
  expect(applicant2Applications[0]).to.equal(2);
});
it("should update application status to Approved when decision is recorded", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);

  const beforeDecision =
    await loanDecisionRegistry.getLoanApplication(1);

  expect(beforeDecision[3]).to.equal(0);

  await loanDecisionRegistry.recordLoanDecision(
    1,
    "Approved"
  );

  const application =
    await loanDecisionRegistry.getLoanApplication(1);

  expect(application[3]).to.equal(1);

  const decision =
    await loanDecisionRegistry.getLoanDecision(1);

  expect(decision[1]).to.equal("Approved");
});
it("should update application status to Rejected when decision is recorded", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);

  await loanDecisionRegistry.recordLoanDecision(
    1,
    "Rejected"
  );

  const application =
    await loanDecisionRegistry.getLoanApplication(1);

  expect(application[3]).to.equal(2);

  const decision =
    await loanDecisionRegistry.getLoanDecision(1);

  expect(decision[1]).to.equal("Rejected");
});
it("should reject an invalid loan decision", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);

  await expect(
    loanDecisionRegistry.recordLoanDecision(
      1,
      "Pending"
    )
  ).to.be.revertedWith("Invalid loan decision");
});
it("should reject a decision for a non-existent loan application", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await expect(
    loanDecisionRegistry.recordLoanDecision(
      999,
      "Approved"
    )
  ).to.be.revertedWith("Loan application not found");
});
it("should return Pending status for a newly registered application", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);

  const status =
    await loanDecisionRegistry.getLoanApplicationStatus(1);

  expect(status).to.equal(0);
});
it("should return Pending status for a newly registered application", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);

  const status =
    await loanDecisionRegistry.getLoanApplicationStatus(1);

  expect(status).to.equal(0);
});
it("should emit status update event when a loan decision is recorded", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);

  await expect(
    loanDecisionRegistry.recordLoanDecision(1, "Approved")
  )
    .to.emit(loanDecisionRegistry, "LoanApplicationStatusUpdated")
    .withArgs(
      1,
      1,
      (value: bigint) => value > 0
    );
});
it("should emit Rejected status update event", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);

  await expect(
    loanDecisionRegistry.recordLoanDecision(1, "Rejected")
  )
    .to.emit(loanDecisionRegistry, "LoanApplicationStatusUpdated")
    .withArgs(
      1,
      2,
      (value: bigint) => value > 0
    );
});
it("should not allow a second decision for the same application", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);

  await loanDecisionRegistry.recordLoanDecision(
    1,
    "Approved"
  );

  await expect(
    loanDecisionRegistry.recordLoanDecision(
      1,
      "Rejected"
    )
  ).to.be.revertedWith("Loan decision already recorded");
});
it("should keep an approved application in Approved status", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);

  await loanDecisionRegistry.recordLoanDecision(
    1,
    "Approved"
  );

  const status =
    await loanDecisionRegistry.getLoanApplicationStatus(1);

  expect(status).to.equal(1);
});
it("should reject status retrieval for a non-existent application", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await expect(
    loanDecisionRegistry.getLoanApplicationStatus(999)
  ).to.be.revertedWith("Loan application not found");
});
it("should allow an applicant to retrieve their own application", async function () {
  const { ethers } = await network.connect();

  const [applicant] = await ethers.getSigners();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(75000);

  const application =
    await loanDecisionRegistry.getMyLoanApplication(1);

  expect(application[0]).to.equal(1);
  expect(application[1]).to.equal(applicant.address);
  expect(application[2]).to.equal(75000);
  expect(application[3]).to.equal(0);
});
it("should reject retrieval by another applicant", async function () {
  const { ethers } = await network.connect();

  const [applicant, otherUser] = await ethers.getSigners();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry
    .connect(applicant)
    .registerLoanApplication(75000);

  await expect(
    loanDecisionRegistry
      .connect(otherUser)
      .getMyLoanApplication(1)
  ).to.be.revertedWith("Not the application owner");
});
it("should reject retrieval of a non-existent application", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await expect(
    loanDecisionRegistry.getMyLoanApplication(999)
  ).to.be.revertedWith("Loan application not found");
});
it("should reject applicant application history lookup for zero address", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await expect(
    loanDecisionRegistry.getApplicantApplications(
      ethers.ZeroAddress
    )
  ).to.be.revertedWith("Invalid applicant address");
});
it("should track an application from Pending to Approved", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(100000);

  const pendingStatus =
    await loanDecisionRegistry.getLoanApplicationStatus(1);

  expect(pendingStatus).to.equal(0);

  await loanDecisionRegistry.recordLoanDecision(
    1,
    "Approved"
  );

  const approvedStatus =
    await loanDecisionRegistry.getLoanApplicationStatus(1);

  expect(approvedStatus).to.equal(1);

  const application =
    await loanDecisionRegistry.getLoanApplication(1);

  expect(application[0]).to.equal(1);
  expect(application[2]).to.equal(100000);
  expect(application[3]).to.equal(1);
});
it("should track an application from Pending to Rejected", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(80000);

  const pendingStatus =
    await loanDecisionRegistry.getLoanApplicationStatus(1);

  expect(pendingStatus).to.equal(0);

  await loanDecisionRegistry.recordLoanDecision(
    1,
    "Rejected"
  );

  const rejectedStatus =
    await loanDecisionRegistry.getLoanApplicationStatus(1);

  expect(rejectedStatus).to.equal(2);

  const application =
    await loanDecisionRegistry.getLoanApplication(1);

  expect(application[0]).to.equal(1);
  expect(application[2]).to.equal(80000);
  expect(application[3]).to.equal(2);
});
it("should preserve applicant application history after decisions", async function () {
  const { ethers } = await network.connect();

  const LoanDecisionRegistry = await ethers.getContractFactory(
    "LoanDecisionRegistry"
  );

  const loanDecisionRegistry = await LoanDecisionRegistry.deploy();

  await loanDecisionRegistry.registerLoanApplication(50000);
  await loanDecisionRegistry.registerLoanApplication(75000);

  await loanDecisionRegistry.recordLoanDecision(
    1,
    "Approved"
  );

  const applications =
    await loanDecisionRegistry.getApplicantApplications(
      (await ethers.getSigners())[0].address
    );

  expect(applications.length).to.equal(2);
  expect(applications[0]).to.equal(1);
  expect(applications[1]).to.equal(2);
  
});
});