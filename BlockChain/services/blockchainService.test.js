
import test from "node:test";
import assert from "node:assert/strict";

import {
  APPLICATION_STATUS,
  SEPOLIA_CHAIN_ID,
  validateApplicationId,
  validateAddress,
  mapApplicationStatus,
  mapPredictionToDecision,
} from "./blockchainService.js";

// ------------------------------------------
// NETWORK CONFIGURATION TESTS
// ------------------------------------------

test("Sepolia chain ID should be correct", () => {
  assert.equal(SEPOLIA_CHAIN_ID, 11155111);
});

test("Supported loan statuses should be correctly defined", () => {
  assert.deepEqual(APPLICATION_STATUS, {
    0: "Pending",
    1: "Approved",
    2: "Rejected",
  });
});

// ------------------------------------------
// APPLICATION ID VALIDATION TESTS
// ------------------------------------------

test("Should accept valid application IDs", () => {
  assert.equal(validateApplicationId(1), "1");
  assert.equal(validateApplicationId("25"), "25");
  assert.equal(validateApplicationId(100n), "100");
});

test("Should reject invalid application IDs", () => {
  const invalidIds = [
    0,
    -1,
    "0",
    "-5",
    "1.5",
    "",
    "abc",
    null,
    undefined,
    " 1",
  ];

  for (const id of invalidIds) {
    assert.throws(() => validateApplicationId(id));
  }
});

// ------------------------------------------
// ETHEREUM ADDRESS VALIDATION TESTS
// ------------------------------------------

test("Should accept a valid Ethereum address", () => {
  const address =
    "0xc7E21E406ECB753eD0b9caB836601057a0577eD8";

  assert.equal(
    validateAddress(address),
    "0xc7E21E406ECB753eD0b9caB836601057a0577eD8"
  );
});

test("Should reject invalid Ethereum addresses", () => {
  assert.throws(() => validateAddress("invalid-address"));
  assert.throws(() => validateAddress(""));
  assert.throws(() => validateAddress(null));
});

// ------------------------------------------
// ON-CHAIN STATUS MAPPING TESTS
// ------------------------------------------

test("Should map Pending status correctly", () => {
  assert.equal(mapApplicationStatus(0), "Pending");
});

test("Should map Approved status correctly", () => {
  assert.equal(mapApplicationStatus(1), "Approved");
});

test("Should map Rejected status correctly", () => {
  assert.equal(mapApplicationStatus(2), "Rejected");
});

test("Should reject unknown blockchain statuses", () => {
  assert.throws(
    () => mapApplicationStatus(3),
    /Unknown loan application status/
  );

  assert.throws(
    () => mapApplicationStatus(-1),
    /Unknown loan application status/
  );
});

// ------------------------------------------
// AI PREDICTION TO BLOCKCHAIN DECISION TESTS
// ------------------------------------------

test("AI prediction 1 should map to Approved", () => {
  assert.equal(mapPredictionToDecision(1), "Approved");
});

test("AI prediction 0 should map to Rejected", () => {
  assert.equal(mapPredictionToDecision(0), "Rejected");
});

test("Invalid AI predictions should be rejected", () => {
  const invalidPredictions = [
    -1,
    2,
    "1",
    "0",
    null,
    undefined,
    true,
    false,
  ];

  for (const prediction of invalidPredictions) {
    assert.throws(
      () => mapPredictionToDecision(prediction),
      /Prediction must be either 0/
    );
  }
});