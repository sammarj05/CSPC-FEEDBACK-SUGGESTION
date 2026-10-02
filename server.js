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
const db   = require("./config/database");
const PORT = process.env.PORT || 3000;
//Gracefulshutdownsupport(closesHTTPserverandMYSQLpool)
//appdevelopment  and demonstrationkeneme, not only is it blah. But its also blah
//BAHAHHA app development // js
const server = app.listen(PORT, () => {
  console.log(`[Server] CSPC Feedback System running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown support (closes HTTP server and MySQL pool)
async function gracefulShutdown(signal) {
  console.log(`[Server] ${signal} received. Shutting down gracefully.`);
  server.close(async () => {
    console.log("[Server] HTTP server closed.");
    try {
      await db.end();
      console.log("[Server] Database connection pool closed.");
    } catch (err) {
      console.error("[Server] Error closing database pool:", err.message);
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

module.exports = server;