
import express from "express";

import {
  connectReadOnly,
  getApplicationCounter,
  getApplicationSummary,
  getApplicationStatus,
  getApplicantApplications,
  validateApplicationId,
  validateAddress,
  recordApplicationDecision,
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
// RECORD AI DECISION ON BLOCKCHAIN
// --------------------------------------------------

router.post("/applications/:applicationId/decision", async (req, res) => {
  try {
    // Internal API authentication
    const apiKey = req.headers["x-api-key"];

    if (
      !process.env.BLOCKCHAIN_API_SECRET ||
      apiKey !== process.env.BLOCKCHAIN_API_SECRET
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized API request.",
      });
    }

    const applicationId = validateApplicationId(
      req.params.applicationId
    );

    const { prediction } = req.body;

    if (prediction !== 0 && prediction !== 1) {
      return res.status(400).json({
        success: false,
        message: "Prediction must be 0 (Rejected) or 1 (Approved).",
      });
    }

    const result = await recordApplicationDecision(
      applicationId,
      prediction
    );

    return res.status(200).json({
      success: true,
      message: "AI decision successfully verified on blockchain.",
      data: result,
    });

  } catch (error) {
    console.error("Decision recording failed:", error);

    if (error.message.includes("does not exist")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes("already has a different") ||
      error.message.includes("not the authorized")
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(502).json({
      success: false,
      message: "Unable to record AI decision on blockchain.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// API ROUTER EXPORT
// --------------------------------------------------

export default router;
