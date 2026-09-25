"use strict";

/**
 * models/responseModel.js
 *
 * Data-access layer for `feedback_responses` and
 * `feedback_status_history` tables.
 *
 * Requirements traced:
 *   FR-06 — Administrator can respond to feedback
 */

const db = require("../config/database");

/**
 * Insert an admin response for a feedback record.
 *
 * @param {{ feedbackId, adminId, message }} data
 * @returns {Promise<number>} insertId
 */
async function createResponse({ feedbackId, adminId, message }) {
  const [result] = await db.query(
    `INSERT INTO feedback_responses (feedback_id, admin_id, message)
     VALUES (?, ?, ?)`,
    [feedbackId, adminId, message.trim()]
  );
  return result.insertId;
}

/**
 * Get all responses for a feedback record, ordered chronologically.
 *
 * @param {number} feedbackId
 * @returns {Promise<Array>}
 */
async function getResponses(feedbackId) {
  const [rows] = await db.query(
    `SELECT r.id, r.message, r.created_at,
            u.name AS admin_name
     FROM   feedback_responses r
     LEFT   JOIN users u ON u.id = r.admin_id
     WHERE  r.feedback_id = ?
     ORDER  BY r.created_at ASC`,
    [feedbackId]
  );
  return rows;
}

/**
 * Get the status history for a feedback record.
 *
 * @param {number} feedbackId
 * @returns {Promise<Array>}
 */
async function getStatusHistory(feedbackId) {
  const [rows] = await db.query(
    `SELECT h.old_status, h.new_status, h.note, h.created_at,
            u.name AS changed_by_name
     FROM   feedback_status_history h
     LEFT   JOIN users u ON u.id = h.changed_by
     WHERE  h.feedback_id = ?
     ORDER  BY h.created_at ASC`,
    [feedbackId]
  );
  return rows;
}

module.exports = { createResponse, getResponses, getStatusHistory };
