"use strict";

/**
 * models/userModel.js
 *
 * Data-access layer for the `users` table.
 * ALL queries use parameterized statements — never string concatenation.
 *
 * Requirements traced:
 *   FR-01  — Student registration / OAuth provisioning
 *   NFR-01 — Passwords stored only as bcrypt hashes
 *   NFR-02 — Role stored server-side / database-side
 */

const db = require("../config/database");

/**
 * Find a user by their email address.
 * Used during login and registration duplicate checks.
 */
async function findByEmail(email) {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
}

/**
 * Find a user by their primary key.
 * Returns only safe fields — never the password hash.
 */
async function findById(id) {
  const [rows] = await db.query(
    "SELECT id, name, email, role, student_id, department, is_active, google_id, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

/**
 * Create a new student account with a bcrypt password hash.
 * Used for manual email/password registration.
 *
 * @param {{ name, email, passwordHash, studentId, department }} data
 * @returns {Promise<number>} insertId
 */
async function createStudent({ name, email, passwordHash, studentId, department }) {
  const [result] = await db.query(
    `INSERT INTO users (name, email, password_hash, role, student_id, department)
     VALUES (?, ?, ?, 'student', ?, ?)`,
    [
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      studentId ? studentId.trim() : null,
      department ? department.trim() : null,
    ]
  );
  return result.insertId;
}

/**
 * Create a new student account via Google OAuth (no password).
 * password_hash is NULL — these accounts authenticate only via Google.
 *
 * @param {{ name, email, googleId, avatar }} data
 * @returns {Promise<number>} insertId
 */
async function createStudentOAuth({ name, email, googleId, avatar }) {
  const [result] = await db.query(
    `INSERT INTO users (name, email, password_hash, role, google_id, avatar)
     VALUES (?, ?, NULL, 'student', ?, ?)`,
    [
      name.trim(),
      email.toLowerCase().trim(),
      googleId || null,
      avatar  || null,
    ]
  );
  return result.insertId;
}

module.exports = { findByEmail, findById, createStudent, createStudentOAuth };
