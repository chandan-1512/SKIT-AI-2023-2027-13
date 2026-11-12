
import "dotenv/config";

import express from "express";
import blockchainRoutes from "./routes/blockchainRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;


// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(express.json());

app.use(express.urlencoded({
  extended: true,
}));


// --------------------------------------------------
// SERVER HOME ROUTE
// --------------------------------------------------

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Powered Smart Contract API",
    service: "Blockchain Integration",
    network: "Sepolia",
    version: "1.0.0",
  });
});


// --------------------------------------------------
// BLOCKCHAIN API ROUTES
// --------------------------------------------------

app.use("/api", blockchainRoutes);


// --------------------------------------------------
// INVALID ROUTE HANDLER
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    requestedPath: req.originalUrl,
  });
});


// --------------------------------------------------
// SERVER STARTUP
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `Blockchain API server running on port ${PORT}`
  );

  console.log(
    `API Base URL: http://localhost:${PORT}/api`
  );
});

export default app;
