
import express from "express";

import {
  connectReadOnly,
  getApplicationCounter,
  getApplicationSummary,
  getApplicationStatus,
  getApplicantApplications,
  validateApplicationId,
  validateAddress,
} from "../services/blockchainService.js";

const router = express.Router();


// --------------------------------------------------
// COMMON ERROR HANDLER
// --------------------------------------------------

function handleBlockchainError(res, error) {
  console.error("Blockchain API Error:", error.message);

  const message = error.message || "Blockchain request failed";

  if (
    message.includes("positive integer") ||
    message.includes("valid Ethereum address")
  ) {
    return res.status(400).json({
      success: false,
      message,
    });
  }

  if (message.includes("does not exist")) {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  return res.status(502).json({
    success: false,
    message: "Unable to retrieve blockchain data",
    error: message,
  });
}


// --------------------------------------------------
// BLOCKCHAIN HEALTH API
// --------------------------------------------------

router.get("/health", async (req, res) => {
  try {
    const connection = await connectReadOnly();

    return res.status(200).json({
      success: true,
      message: "Blockchain connection successful",
      network: "Sepolia",
      chainId: connection.chainId,
      contractAddress: connection.contractAddress,
    });
  } catch (error) {
    return handleBlockchainError(res, error);
  }
});


// --------------------------------------------------
// APPLICATION COUNTER API
// --------------------------------------------------

router.get("/applications/count", async (req, res) => {
  try {
    const count = await getApplicationCounter();

    return res.status(200).json({
      success: true,
      network: "Sepolia",
      totalApplications: count,
    });
  } catch (error) {
    return handleBlockchainError(res, error);
  }
});


// --------------------------------------------------
// APPLICATION SUMMARY API
// --------------------------------------------------

router.get("/applications/:applicationId", async (req, res) => {
  try {
    const applicationId = validateApplicationId(
      req.params.applicationId
    );

    const application = await getApplicationSummary(
      applicationId
    );

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    return handleBlockchainError(res, error);
  }
});


// --------------------------------------------------
// APPLICATION STATUS API
// --------------------------------------------------

router.get(
  "/applications/:applicationId/status",
  async (req, res) => {
    try {
      const applicationId = validateApplicationId(
        req.params.applicationId
      );

      const applicationStatus = await getApplicationStatus(
        applicationId
      );

      return res.status(200).json({
        success: true,
        data: applicationStatus,
      });
    } catch (error) {
      return handleBlockchainError(res, error);
    }
  }
);


// --------------------------------------------------
// APPLICANT APPLICATION HISTORY API
// --------------------------------------------------

router.get(
  "/applicants/:address/applications",
  async (req, res) => {
    try {
      const address = validateAddress(
        req.params.address
      );

      const applications = await getApplicantApplications(
        address
      );

      return res.status(200).json({
        success: true,
        applicantAddress: address,
        totalApplications: applications.length,
        data: applications,
      });
    } catch (error) {
      return handleBlockchainError(res, error);
    }
  }
);


// --------------------------------------------------
// API ROUTER EXPORT
// --------------------------------------------------

export default router;
