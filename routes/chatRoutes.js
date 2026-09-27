"use strict";

/**
 * routes/chatRoutes.js
 *
 * Aizen AI — chat API routes and admin chat routes.
 *
 * API routes (POST /api/chat, POST /api/chat/escalate):
 *   - Open to authenticated users AND guests (guests get a session-scoped conversation).
 *   - Rate-limited to prevent Gemini API abuse.
 *
 * Admin chat routes (GET /admin/chat, GET /admin/chat/:id, POST /admin/chat/:id/reply):
 *   - Protected by requireLogin + requireRole("admin").
 *
 * Security notes:
 *   - GEMINI_API_KEY never reaches the client.
 *   - User identity always comes from req.session.
 *   - Rate limiter is applied per IP.
 */

const express    = require("express");
const rateLimit  = require("express-rate-limit");
const chatCtrl   = require("../controllers/chatController");
const { requireLogin, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Rate limiter: max 20 chat messages per 10 minutes per IP
const chatLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: "Too many messages. Please wait a moment before sending more." },
});

// ---------------------------------------------------------------
// Public / semi-public API routes
// (guests are allowed; logged-in users get scoped conversations)
// ---------------------------------------------------------------

// POST /api/chat — send a message to Aizen AI
router.post("/api/chat", chatLimiter, chatCtrl.sendMessage);

// POST /api/chat/escalate — escalate conversation to admin
router.post("/api/chat/escalate", chatLimiter, chatCtrl.escalateConversation);

// ---------------------------------------------------------------
// Admin chat routes — require admin role
// ---------------------------------------------------------------

// GET /admin/chat — list all conversations
router.get(
  "/admin/chat",
  requireLogin,
  requireRole("admin"),
  chatCtrl.adminChatList
);

// GET /admin/chat/:id — view a conversation
router.get(
  "/admin/chat/:id",
  requireLogin,
  requireRole("admin"),
  chatCtrl.adminChatDetail
);

// POST /admin/chat/:id/reply — admin sends a reply
router.post(
  "/admin/chat/:id/reply",
  requireLogin,
  requireRole("admin"),
  chatCtrl.adminReply
);

module.exports = router;
