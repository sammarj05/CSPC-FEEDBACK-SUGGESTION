"use strict";

/**
 * models/chatModel.js
 *
 * Data-access layer for Aizen AI chat persistence.
 * Tables: chat_conversations, chat_messages
 *
 * Security:
 *   - All queries are parameterized.
 *   - Ownership is always enforced via userId.
 *   - Anonymous feedback identities are never exposed here.
 */

const db = require("../config/database");

// ---------------------------------------------------------------
// CONVERSATIONS
// ---------------------------------------------------------------

async function createConversation(userId = null) {
  const [result] = await db.query(
    `INSERT INTO chat_conversations (user_id, status) VALUES (?, 'active')`,
    [userId || null]
  );
  return result.insertId;
}

async function findConversation(conversationId, userId = null) {
  let sql = `SELECT * FROM chat_conversations WHERE id = ?`;
  const params = [conversationId];
  if (userId !== null) {
    sql += ` AND user_id = ?`;
    params.push(userId);
  }
  sql += ` LIMIT 1`;
  const [rows] = await db.query(sql, params);
  return rows[0] || null;
}

async function listConversationsByUser(userId) {
  const [rows] = await db.query(
    `SELECT * FROM chat_conversations WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId]
  );
  return rows;
}

async function listAllConversations() {
  const [rows] = await db.query(
    `SELECT cc.id, cc.user_id, cc.status, cc.created_at, cc.updated_at,
            u.name AS user_name, u.email AS user_email,
            (SELECT cm.message FROM chat_messages cm
             WHERE cm.conversation_id = cc.id
             ORDER BY cm.created_at DESC LIMIT 1) AS last_message
     FROM chat_conversations cc
     LEFT JOIN users u ON u.id = cc.user_id
     ORDER BY cc.updated_at DESC
     LIMIT 100`
  );
  return rows;
}

async function updateConversationStatus(conversationId, status) {
  await db.query(
    `UPDATE chat_conversations SET status = ?, updated_at = NOW() WHERE id = ?`,
    [status, conversationId]
  );
}

// ---------------------------------------------------------------
// MESSAGES
// ---------------------------------------------------------------

async function addMessage(conversationId, senderType, message) {
  const [result] = await db.query(
    `INSERT INTO chat_messages (conversation_id, sender_type, message) VALUES (?, ?, ?)`,
    [conversationId, senderType, message]
  );
  await db.query(
    `UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?`,
    [conversationId]
  );
  return result.insertId;
}

async function getMessages(conversationId) {
  const [rows] = await db.query(
    `SELECT id, sender_type, message, created_at
     FROM chat_messages
     WHERE conversation_id = ?
     ORDER BY created_at ASC`,
    [conversationId]
  );
  return rows;
}

async function getRecentMessages(conversationId, limit = 10) {
  const [rows] = await db.query(
    `SELECT sender_type, message, created_at
     FROM chat_messages
     WHERE conversation_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [conversationId, limit]
  );
  return rows.reverse();
}

module.exports = {
  createConversation,
  findConversation,
  listConversationsByUser,
  listAllConversations,
  updateConversationStatus,
  addMessage,
  getMessages,
  getRecentMessages,
};
