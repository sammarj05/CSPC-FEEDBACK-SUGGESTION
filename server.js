"use strict";

/**
 * server.js
 *
 * Entry point for the CSPC Feedback System.
 *
 * This file ONLY starts the server.
 * All Express configuration lives in app.js.
 *
 * This separation allows Vitest and SuperTest to import
 * app.js without binding to a port, enabling clean test isolation.
 */

require("dotenv").config();

const app  = require("./app");
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[Server] CSPC Feedback System running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown support
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received. Shutting down gracefully.");
  server.close(() => {
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });
});

module.exports = server;