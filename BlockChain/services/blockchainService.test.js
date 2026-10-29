import test from "node:test";
import assert from "node:assert/strict";

import {
  APPLICATION_STATUS,
  validateApplicationId,
  validateAddress,
  mapApplicationStatus,
  SEPOLIA_CHAIN_ID,
} from "./blockchainService.js";

test("should define the Sepolia chain ID correctly", () => {
  assert.equal(SEPOLIA_CHAIN_ID, 11155111);
});

test("should define all supported loan statuses", () => {
  assert.deepEqual(APPLICATION_STATUS, {
    0: "Pending",
    1: "Approved",
    2: "Rejected",
  });
});

test("should accept valid application IDs", () => {
  assert.equal(validateApplicationId(1), "1");
  assert.equal(validateApplicationId("25"), "25");
  assert.equal(validateApplicationId(100n), "100");
});

test("should reject invalid application IDs", () => {
  for (const id of [0, -1, "0", "-5", "1.5", "", "abc", null, undefined]) {
    assert.throws(() => validateApplicationId(id));
  }
});

test("should map each supported loan status", () => {
  assert.equal(mapApplicationStatus(0), "Pending");
  assert.equal(mapApplicationStatus(1), "Approved");
  assert.equal(mapApplicationStatus(2), "Rejected");
});

test("should reject unknown loan statuses", () => {
  assert.throws(() => mapApplicationStatus(3), /Unknown loan application status/);
  assert.throws(() => mapApplicationStatus(-1), /Unknown loan application status/);
});

test("should accept a valid Ethereum address", () => {
  const address = "0xc7E21E406ECB753eD0b9caB836601057a0577eD8";

  assert.equal(
    validateAddress(address),
    "0xc7E21E406ECB753eD0b9caB836601057a0577eD8"
  );
});

test("should reject invalid Ethereum addresses", () => {
  assert.throws(() => validateAddress("invalid-address"));
  assert.throws(() => validateAddress(""));
  assert.throws(() => validateAddress(null));
});