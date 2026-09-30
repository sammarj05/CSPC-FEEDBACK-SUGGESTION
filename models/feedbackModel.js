"use strict";

/**
 * models/feedbackModel.js
 *
 * Data-access layer for the `feedback` table.
 * ALL queries use parameterized statements.
 *
 * Requirements traced:
 *   FR-02 — Feedback submission
 *   FR-03 — Unique reference number
 *   FR-04 — Students see only their own feedback (ownership scope)
 *   FR-05 — Admin updates feedback status
 *   NFR-03 — Ownership-scoped queries
 */

const db = require("../config/database");

// ---------------------------------------------------------------
// Reference number generation
// ---------------------------------------------------------------

/**
 * Generate a unique reference number in the format FB-YYYY-#####.
 * Uses a database query to find the current year's max sequence.
 *
 * @returns {Promise<string>}
 */
async function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const prefix = `FB-${year}-`;

  const [rows] = await db.query(
    `SELECT reference_number
     FROM feedback
     WHERE reference_number LIKE ?
     ORDER BY id DESC
     LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSeq = 1;
  if (rows.length > 0) {
    const last = rows[0].reference_number;
    const parts = last.split("-");
    nextSeq = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
}

// ---------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------

/**
 * Insert a new feedback record and record the initial status history.
 *
 * IMPORTANT: user_id is ALWAYS stored as the real student ID, even for
 * anonymous submissions. The is_anonymous flag controls visibility —
 * admin queries mask the identity via CASE WHEN, but the student's own
 * ownership queries (WHERE user_id = ?) still work correctly.
 *
 * @param {{ userId, categoryId, type, priority, subject, description, isAnonymous }} data
 * @returns {Promise<{ insertId: number, referenceNumber: string }>}
 */
async function create({ userId, categoryId, type, priority, subject, description, isAnonymous }) {
  const referenceNumber = await generateReferenceNumber();

  // Always store the real userId — never null it out for anonymous submissions.
  // is_anonymous = 1 tells admin queries to mask identity; student queries
  // use WHERE user_id = ? which needs a real value to match.
  const storedUserId = userId ? parseInt(userId, 10) : null;

  const [result] = await db.query(
    `INSERT INTO feedback
       (reference_number, user_id, category_id, type, priority, subject, description, is_anonymous, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
    [
      referenceNumber,
      storedUserId,
      categoryId,
      type,
      priority,
      subject.trim(),
      description.trim(),
      isAnonymous ? 1 : 0,
    ]
  );

  // Record initial status history
  await db.query(
    `INSERT INTO feedback_status_history (feedback_id, changed_by, old_status, new_status, note)
     VALUES (?, NULL, NULL, 'submitted', 'Feedback submitted by student.')`,
    [result.insertId]
  );

  return { insertId: result.insertId, referenceNumber };
}

// ---------------------------------------------------------------
// READ — Student (ownership-scoped)
// ---------------------------------------------------------------

/**
 * Get all feedback for a specific student.
 * WHERE clause always includes user_id to enforce ownership.
 *
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function findByUserId(userId) {
  const [rows] = await db.query(
    `SELECT f.id, f.reference_number, f.subject, f.type, f.priority,
            f.status, f.is_anonymous, f.created_at, f.updated_at,
            c.name AS category_name
     FROM   feedback f
     JOIN   categories c ON c.id = f.category_id
     WHERE  f.user_id = ?
     ORDER  BY f.created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Find a single feedback record — ownership enforced by user_id.
 * Prevents cross-account access (NFR-03).
 *
 * @param {number} feedbackId
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function findByIdAndUser(feedbackId, userId) {
  const [rows] = await db.query(
    `SELECT f.*, c.name AS category_name
     FROM   feedback f
     JOIN   categories c ON c.id = f.category_id
     WHERE  f.id = ? AND f.user_id = ?
     LIMIT  1`,
    [feedbackId, userId]
  );
  return rows[0] || null;
}

// ---------------------------------------------------------------
// READ — Admin (identity masked for anonymous feedback)
// ---------------------------------------------------------------

/**
 * Admin: find a feedback record by its reference number.
 * Student identity is masked if submission is anonymous.
 *
 * @param {string} referenceNumber
 * @returns {Promise<object|null>}
 */
async function findByReference(referenceNumber) {
  const [rows] = await db.query(
    `SELECT f.id, f.reference_number, f.category_id, f.type, f.priority,
            f.subject, f.description, f.is_anonymous, f.status, f.created_at, f.updated_at,
            CASE WHEN f.is_anonymous = 1 THEN NULL ELSE f.user_id END AS user_id,
            c.name AS category_name,
            CASE WHEN f.is_anonymous = 1 THEN NULL ELSE u.name END AS student_name,
            CASE WHEN f.is_anonymous = 1 THEN NULL ELSE u.email END AS student_email,
            CASE WHEN f.is_anonymous = 1 THEN NULL ELSE u.student_id END AS student_id_no
     FROM   feedback f
     JOIN   categories c ON c.id = f.category_id
     LEFT   JOIN users u ON (u.id = f.user_id AND f.is_anonymous = 0)
     WHERE  f.reference_number = ?
     LIMIT  1`,
    [referenceNumber]
  );
  return rows[0] || null;
}

/**
 * Admin: find a feedback record by primary key.
 * Student identity is masked if submission is anonymous.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findByIdAdmin(id) {
  const [rows] = await db.query(
    `SELECT f.id, f.reference_number, f.category_id, f.type, f.priority,
            f.subject, f.description, f.is_anonymous, f.status, f.created_at, f.updated_at,
            CASE WHEN f.is_anonymous = 1 THEN NULL ELSE f.user_id END AS user_id,
            c.name AS category_name,
            CASE WHEN f.is_anonymous = 1 THEN NULL ELSE u.name END AS student_name,
            CASE WHEN f.is_anonymous = 1 THEN NULL ELSE u.email END AS student_email,
            CASE WHEN f.is_anonymous = 1 THEN NULL ELSE u.student_id END AS student_id_no
     FROM   feedback f
     JOIN   categories c ON c.id = f.category_id
     LEFT   JOIN users u ON (u.id = f.user_id AND f.is_anonymous = 0)
     WHERE  f.id = ?
     LIMIT  1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Admin: get all feedback with optional filters and pagination.
 * Student name is masked if submission is anonymous.
 *
 * @param {{ status, categoryId, type, priority, search, page, perPage }} filters
 * @returns {Promise<{ rows: Array, total: number }>}
 */
async function adminList({ status, categoryId, type, priority, search, page = 1, perPage = 15 }) {
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push("f.status = ?");
    params.push(status);
  }
  if (categoryId) {
    conditions.push("f.category_id = ?");
    params.push(parseInt(categoryId, 10));
  }
  if (type) {
    conditions.push("f.type = ?");
    params.push(type);
  }
  if (priority) {
    conditions.push("f.priority = ?");
    params.push(priority);
  }
  if (search) {
    conditions.push("(f.subject LIKE ? OR f.reference_number LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Total count for pagination
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM feedback f
     JOIN categories c ON c.id = f.category_id
     LEFT JOIN users u ON (u.id = f.user_id AND f.is_anonymous = 0)
     ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  const offset = (page - 1) * perPage;
  const [rows] = await db.query(
    `SELECT f.id, f.reference_number, f.subject, f.type, f.priority,
            f.status, f.is_anonymous, f.created_at, f.updated_at,
            c.name AS category_name,
            CASE WHEN f.is_anonymous = 1 THEN NULL ELSE u.name END AS student_name
     FROM   feedback f
     JOIN   categories c ON c.id = f.category_id
     LEFT   JOIN users u ON (u.id = f.user_id AND f.is_anonymous = 0)
     ${whereClause}
     ORDER  BY f.created_at DESC
     LIMIT  ? OFFSET ?`,
    [...params, perPage, offset]
  );

  return { rows, total };
}

// ---------------------------------------------------------------
// UPDATE — Status
// ---------------------------------------------------------------

/**
 * Update the status of a feedback record and record in history.
 *
 * @param {number} feedbackId
 * @param {string} newStatus
 * @param {number} adminId
 * @param {string|null} note
 */
async function updateStatus(feedbackId, newStatus, adminId, note = null) {
  // Get current status first
  const [current] = await db.query(
    "SELECT status FROM feedback WHERE id = ? LIMIT 1",
    [feedbackId]
  );
  if (!current[0]) return false;

  const oldStatus = current[0].status;

  await db.query(
    "UPDATE feedback SET status = ? WHERE id = ?",
    [newStatus, feedbackId]
  );

  await db.query(
    `INSERT INTO feedback_status_history (feedback_id, changed_by, old_status, new_status, note)
     VALUES (?, ?, ?, ?, ?)`,
    [feedbackId, adminId, oldStatus, newStatus, note || null]
  );

  return true;
}

// ---------------------------------------------------------------
// DASHBOARD STATISTICS
// ---------------------------------------------------------------

/**
 * Count feedback per status for a specific student.
 * All counts come from the database — never hardcoded.
 *
 * @param {number} userId
 * @returns {Promise<object>}
 */
async function studentStats(userId) {
  const [rows] = await db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'submitted') AS submitted,
       SUM(status = 'under_review') AS under_review,
       SUM(status = 'in_progress') AS in_progress,
       SUM(status = 'resolved') AS resolved,
       SUM(status = 'closed') AS closed
     FROM feedback
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0];
}

/**
 * Admin dashboard statistics — counts per status, category, type.
 *
 * @returns {Promise<object>}
 */
async function adminStats() {
  const [overall] = await db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'submitted') AS submitted,
       SUM(status = 'under_review') AS under_review,
       SUM(status = 'in_progress') AS in_progress,
       SUM(status = 'resolved') AS resolved,
       SUM(status = 'closed') AS closed
     FROM feedback`
  );

  const [byCategory] = await db.query(
    `SELECT c.name AS category, COUNT(f.id) AS count
     FROM categories c
     LEFT JOIN feedback f ON f.category_id = c.id
     WHERE c.is_active = 1
     GROUP BY c.id, c.name
     ORDER BY count DESC`
  );

  const [byType] = await db.query(
    `SELECT type, COUNT(*) AS count
     FROM feedback
     GROUP BY type
     ORDER BY count DESC`
  );

  const [recentActivity] = await db.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count
     FROM feedback
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC`
  );

  return {
    overall: overall[0],
    byCategory,
    byType,
    recentActivity,
  };
}

module.exports = {
  generateReferenceNumber,
  create,
  findByUserId,
  findByIdAndUser,
  findByReference,
  findByIdAdmin,
  adminList,
  updateStatus,
  studentStats,
  adminStats,
};
