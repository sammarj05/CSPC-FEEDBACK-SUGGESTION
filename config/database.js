"use strict";

const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * MySQL connection pool (shared singleton).
 * All queries are async/await via the promise API.
 * Never use synchronous MySQL operations.
 *
 * Configured with connectionLimit: 2 to ensure the application
 * stays strictly within the 5-connection limit on Filess MySQL,
 * even during rolling deployments where two instances temporarily coexist.
 */
const pool = mysql.createPool({
  host:                  process.env.DB_HOST     || "localhost",
  port:                  parseInt(process.env.DB_PORT || "3306", 10),
  user:                  process.env.DB_USER     || "root",
  password:              process.env.DB_PASSWORD || "",
  database:              process.env.DB_NAME     || "cspc_feedback_db",
  waitForConnections:    true,
  connectionLimit:       parseInt(process.env.DB_CONNECTION_LIMIT || "2", 10),
  queueLimit:            0,
  connectTimeout:        30000,
  timezone:              "+00:00",
  charset:               "utf8mb4",
});

/**
 * Test that the database is reachable at startup.
 * Logs an error but does not crash the process — the error
 * handler will surface it on the first request if the DB
 * is truly unavailable.
 */
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log("[DB] Connected to MySQL successfully.");
  } catch (err) {
    console.error("[DB] Could not connect to MySQL:", err.message);
  }
}

if (process.env.NODE_ENV !== "test") {
  testConnection();
}

module.exports = pool;
