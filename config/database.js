"use strict";

const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * MySQL connection pool.
 * All queries are async/await via the promise API.
 * Never use synchronous MySQL operations.
 */
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  port:               parseInt(process.env.DB_PORT || "3306", 10),
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "cspc_feedback_db",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           "+00:00",
  charset:            "utf8mb4",
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

testConnection();

module.exports = pool;
