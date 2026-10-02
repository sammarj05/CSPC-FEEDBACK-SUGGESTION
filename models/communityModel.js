"use strict";

/**
 * Data-access layer for the student community feed. Public-facing queries only
 * select explicitly published feedback and never expose submitter identifiers.
 */

const db = require("../config/database");

const VALID_REACTION_TYPES = ["support", "not_helpful"];

function reactionSummarySql() {
  return `
    SELECT feedback_id,
           SUM(reaction_type = 'support') AS support_count,
           SUM(reaction_type = 'not_helpful') AS not_helpful_count
    FROM feedback_reactions
    GROUP BY feedback_id`;
}

function commentSummarySql() {
  return `
    SELECT feedback_id, COUNT(*) AS comment_count
    FROM feedback_comments
    WHERE is_hidden = 0
    GROUP BY feedback_id`;
}

function publicFeedbackFields(userId) {
  return `
    f.id, f.subject, f.description, f.type, f.status, f.is_anonymous,
    f.published_at, c.name AS category_name,
    CASE WHEN f.is_anonymous = 1 THEN 'Anonymous' ELSE 'CSPC Student' END AS author_label,
    COALESCE(reactions.support_count, 0) AS support_count,
    COALESCE(reactions.not_helpful_count, 0) AS not_helpful_count,
    COALESCE(comments.comment_count, 0) AS comment_count,
    current_reaction.reaction_type AS current_reaction`;
}

function publicFeedbackJoins() {
  return `
    JOIN categories c ON c.id = f.category_id
    LEFT JOIN (${reactionSummarySql()}) reactions ON reactions.feedback_id = f.id
    LEFT JOIN (${commentSummarySql()}) comments ON comments.feedback_id = f.id
    LEFT JOIN feedback_reactions current_reaction
      ON current_reaction.feedback_id = f.id AND current_reaction.user_id = ?`;
}

async function listPublished({ type, search, page = 1, perPage = 10, userId }) {
  const conditions = ["f.is_published = 1"];
  const params = [];

  if (type) {
    conditions.push("f.type = ?");
    params.push(type);
  }
  if (search) {
    conditions.push("(f.subject LIKE ? OR f.description LIKE ? OR c.name LIKE ?)");
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM feedback f
     JOIN categories c ON c.id = f.category_id
     ${whereClause}`,
    params
  );

  const offset = (page - 1) * perPage;
  const [rows] = await db.query(
    `SELECT ${publicFeedbackFields(userId)}
     FROM feedback f
     ${publicFeedbackJoins()}
     ${whereClause}
     ORDER BY f.published_at DESC, f.id DESC
     LIMIT ? OFFSET ?`,
    [userId, ...params, perPage, offset]
  );

  return { rows, total: countRows[0].total };
}

async function findPublishedById(feedbackId, userId) {
  const [rows] = await db.query(
    `SELECT ${publicFeedbackFields(userId)}
     FROM feedback f
     ${publicFeedbackJoins()}
     WHERE f.id = ? AND f.is_published = 1
     LIMIT 1`,
    [userId, feedbackId]
  );
  return rows[0] || null;
}

async function getVisibleComments(feedbackId) {
  const [rows] = await db.query(
    `SELECT id, comment_text, created_at,
            'CSPC Student' AS author_label
     FROM feedback_comments
     WHERE feedback_id = ? AND is_hidden = 0
     ORDER BY created_at ASC, id ASC`,
    [feedbackId]
  );
  return rows;
}

async function getReactionCounts(connection, feedbackId) {
  const [rows] = await connection.query(
    `SELECT
       COALESCE(SUM(reaction_type = 'support'), 0) AS support_count,
       COALESCE(SUM(reaction_type = 'not_helpful'), 0) AS not_helpful_count
     FROM feedback_reactions
     WHERE feedback_id = ?`,
    [feedbackId]
  );
  return rows[0];
}

async function lockPublishedFeedback(connection, feedbackId) {
  const [rows] = await connection.query(
    `SELECT id
     FROM feedback
     WHERE id = ? AND is_published = 1
     LIMIT 1
     FOR UPDATE`,
    [feedbackId]
  );
  return rows[0] || null;
}

async function setReaction({ feedbackId, userId, reactionType }) {
  if (!VALID_REACTION_TYPES.includes(reactionType)) {
    return null;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const feedback = await lockPublishedFeedback(connection, feedbackId);
    if (!feedback) {
      await connection.rollback();
      return null;
    }

    const [existingRows] = await connection.query(
      `SELECT reaction_type
       FROM feedback_reactions
       WHERE feedback_id = ? AND user_id = ?
       LIMIT 1`,
      [feedbackId, userId]
    );

    let action;
    if (existingRows[0] && existingRows[0].reaction_type === reactionType) {
      await connection.query(
        "DELETE FROM feedback_reactions WHERE feedback_id = ? AND user_id = ?",
        [feedbackId, userId]
      );
      action = "removed";
    } else if (existingRows[0]) {
      await connection.query(
        `UPDATE feedback_reactions
         SET reaction_type = ?
         WHERE feedback_id = ? AND user_id = ?`,
        [reactionType, feedbackId, userId]
      );
      action = "changed";
    } else {
      await connection.query(
        `INSERT INTO feedback_reactions (feedback_id, user_id, reaction_type)
         VALUES (?, ?, ?)`,
        [feedbackId, userId, reactionType]
      );
      action = "added";
    }

    const counts = await getReactionCounts(connection, feedbackId);
    await connection.commit();
    return { action, ...counts };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function createComment({ feedbackId, userId, commentText }) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const feedback = await lockPublishedFeedback(connection, feedbackId);
    if (!feedback) {
      await connection.rollback();
      return null;
    }

    const [result] = await connection.query(
      `INSERT INTO feedback_comments (feedback_id, user_id, comment_text)
       VALUES (?, ?, ?)`,
      [feedbackId, userId, commentText]
    );
    await connection.commit();
    return result.insertId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function setPublication({ feedbackId, isPublished, adminId }) {
  const [result] = await db.query(
    `UPDATE feedback
     SET is_published = ?,
         published_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
         published_by = CASE WHEN ? = 1 THEN ? ELSE NULL END
     WHERE id = ?`,
    [isPublished ? 1 : 0, isPublished ? 1 : 0, isPublished ? 1 : 0, adminId, feedbackId]
  );
  return result.affectedRows > 0;
}

async function adminComments({ page = 1, perPage = 20 }) {
  const [countRows] = await db.query("SELECT COUNT(*) AS total FROM feedback_comments");
  const offset = (page - 1) * perPage;
  const [rows] = await db.query(
    `SELECT cm.id, cm.comment_text, cm.is_hidden, cm.created_at,
            f.id AS feedback_id, f.reference_number, f.subject
     FROM feedback_comments cm
     JOIN feedback f ON f.id = cm.feedback_id
     ORDER BY cm.created_at DESC, cm.id DESC
     LIMIT ? OFFSET ?`,
    [perPage, offset]
  );
  return { rows, total: countRows[0].total };
}

async function setCommentVisibility(commentId, isHidden) {
  const [result] = await db.query(
    "UPDATE feedback_comments SET is_hidden = ? WHERE id = ?",
    [isHidden ? 1 : 0, commentId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  VALID_REACTION_TYPES,
  listPublished,
  findPublishedById,
  getVisibleComments,
  setReaction,
  createComment,
  setPublication,
  adminComments,
  setCommentVisibility,
};
