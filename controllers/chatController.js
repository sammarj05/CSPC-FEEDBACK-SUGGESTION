"use strict";

/**
 * controllers/chatController.js
 *
 * Aizen AI � Express controller for the chatbot feature.
 *
 * Architecture:
 *   Browser ? POST /api/chat ? chatController ? Gemini API ? response
 *
 * Security:
 *   - GEMINI_API_KEY is never sent to the client.
 *   - User identity always comes from req.session (never from req.body).
 *   - Feedback status lookup is ownership-scoped.
 *   - Input is validated and length-limited before reaching Gemini.
 *   - Gemini never has direct DB access � only controlled helper functions.
 *   - Anonymous feedback identity is never revealed.
 *   - Rate limiting is applied at the route level.
 */

const chatModel    = require("../models/chatModel");
const feedbackModel = require("../models/feedbackModel");
const logger        = require("../lib/logger");

const MAX_MESSAGE_LENGTH = 1000;

// ---------------------------------------------------------------
// Gemini client (lazy-init so app starts even without the key)
// ---------------------------------------------------------------
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
].filter(Boolean);

async function generateAiReply(history, systemInstruction, userMessage) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    } catch (err) {
      lastError = err;
      logger.warn(`Model ${modelName} failed, trying next candidate`, { error: err.message });
    }
  }
  throw lastError || new Error("All Gemini models failed.");
}

// ---------------------------------------------------------------
// Aizen AI system prompt
// ---------------------------------------------------------------
const SYSTEM_PROMPT = `You are Aizen AI, the AI assistant for the CSPC School Suggestion & Feedback System at Camarines Sur Polytechnic Colleges (CSPC).

Your role is to help students, visitors, and users understand and use the feedback system.

IDENTITY RULES:
- You are Aizen AI, an AI assistant. Never pretend to be a human administrator.
- Always identify yourself as Aizen AI when relevant.
- Clearly distinguish yourself from human administrators.

WHAT YOU CAN HELP WITH:
- Explaining what the CSPC Feedback System is and how it works.
- How to submit feedback, suggestions, complaints, concerns, or appreciation.
- How anonymous feedback works (submissions are anonymous to admins; the student can still track their own).
- How to track submitted feedback using reference numbers.
- What each status means:
  * Submitted: Your feedback has been received and is waiting to be reviewed.
  * Under Review: An administrator is currently reviewing your feedback.
  * In Progress: Action is being taken on your feedback.
  * Resolved: Your feedback has been addressed and a resolution has been applied.
  * Closed: The feedback case has been closed.
- How to log in (Google OAuth or email/password).
- What types of feedback can be submitted: Suggestion, Complaint, Concern, General Feedback, Appreciation.
- Priority levels: Low, Medium, High.
- How to contact an administrator (recommend using the "Talk to an Admin" button or submitting feedback through the system).

STRICT RULES � YOU MUST NEVER:
- Invent school policies, deadlines, or administrative decisions.
- Claim feedback has been resolved or changed when it has not.
- Change, delete, or modify any feedback.
- Pretend to be a CSPC administrator or human staff.
- Reveal any user's private information.
- Reveal the identity of anyone who submitted anonymous feedback.
- Access the database directly or generate SQL queries.
- Execute any code, commands, or system operations.
- Perform any administrative actions.
- Discuss topics unrelated to the CSPC Feedback System (politely redirect).

IF YOU DON'T KNOW SOMETHING:
- Clearly say you don't have enough information.
- Recommend contacting an administrator via the "Talk to an Admin" button.

TONE: Be helpful, concise, friendly, and professional. Keep responses brief and easy to understand.`;

// ---------------------------------------------------------------
// Controlled backend function: feedback status lookup
// Only returns data owned by the authenticated user.
// ---------------------------------------------------------------
async function getMyFeedbackStatus(referenceNumber, userId) {
  if (!referenceNumber || !userId) return null;
  // Sanitize reference number format
  if (!/^FB-\d{4}-\d{5}$/.test(referenceNumber.toUpperCase())) return null;

  const [rows] = await require("../config/database").query(
    `SELECT f.reference_number, f.subject, f.status, f.is_anonymous, f.created_at, f.updated_at
     FROM feedback f
     WHERE f.reference_number = ? AND f.user_id = ?
     LIMIT 1`,
    [referenceNumber.toUpperCase(), userId]
  );
  return rows[0] || null;
}

// ---------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------
async function sendMessage(req, res) {
  try {
    const { message, conversationId } = req.body;
    const userId = req.session?.user?.id || null;

    // --- Input validation ---
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }
    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `Message is too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    const userMessage = message.trim();

    // --- Resolve or create conversation ---
    let convId = conversationId ? parseInt(conversationId, 10) : null;
    if (convId) {
      // Verify ownership � users can only access their own conversations
      const conv = await chatModel.findConversation(convId, userId);
      if (!conv) {
        // Conversation not found or doesn't belong to this user ? create new
        convId = await chatModel.createConversation(userId);
      }
    } else {
      convId = await chatModel.createConversation(userId);
    }

    // --- Persist user message ---
    await chatModel.addMessage(convId, "user", userMessage);

    // --- Check if message contains a reference number for status lookup ---
    let feedbackContext = "";
    if (userId) {
      const refMatch = userMessage.match(/FB-\d{4}-\d{5}/i);
      if (refMatch) {
        const feedbackStatus = await getMyFeedbackStatus(refMatch[0], userId);
        if (feedbackStatus) {
          feedbackContext = `\n\n[SYSTEM CONTEXT � visible only to you as Aizen AI, do not expose raw data]:
The authenticated user owns feedback ${feedbackStatus.reference_number}.
Subject: "${feedbackStatus.subject}"
Current status: ${feedbackStatus.status}
Submitted: ${new Date(feedbackStatus.created_at).toLocaleDateString("en-PH")}
Last updated: ${new Date(feedbackStatus.updated_at).toLocaleDateString("en-PH")}
Anonymous: ${feedbackStatus.is_anonymous ? "Yes (do not reveal student identity)" : "No"}
Use this information to answer the user's question accurately.`;
        } else {
          feedbackContext = `\n\n[SYSTEM CONTEXT]: The reference number ${refMatch[0]} was not found in the authenticated user's feedback records. Do not invent a status.`;
        }
      }
    }

    // --- Get recent conversation history for Gemini ---
    const recentMessages = await chatModel.getRecentMessages(convId, 8);
    const history = recentMessages
      .slice(0, -1) // exclude the message we just added
      .map((m) => ({
        role: m.sender_type === "user" ? "user" : "model",
        parts: [{ text: m.message }],
      }));

    // --- Call Gemini ---
    let aiReply;
    try {
      aiReply = await generateAiReply(
        history,
        SYSTEM_PROMPT + feedbackContext,
        userMessage
      );
    } catch (geminiErr) {
      logger.error("Gemini API error", { error: geminiErr.message });
      // Persist a fallback message
      await chatModel.addMessage(
        convId,
        "ai",
        "Aizen AI is temporarily unavailable. Please try again later or use the 'Talk to an Admin' button."
      );
      return res.status(200).json({
        reply: "Aizen AI is temporarily unavailable. Please try again later or use the 'Talk to an Admin' button.",
        conversationId: convId,
        senderType: "ai",
        unavailable: true,
      });
    }

    // --- Persist AI reply ---
    await chatModel.addMessage(convId, "ai", aiReply);

    return res.status(200).json({
      reply: aiReply,
      conversationId: convId,
      senderType: "ai",
    });
  } catch (err) {
    logger.error("Chat controller error", { error: err.message });
    return res.status(500).json({
      error: "Something went wrong. Please try again or talk to an admin.",
    });
  }
}

// ---------------------------------------------------------------
// POST /api/chat/escalate � mark conversation as escalated
// ---------------------------------------------------------------
async function escalateConversation(req, res) {
  try {
    const { conversationId } = req.body;
    const userId = req.session?.user?.id || null;

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required." });
    }

    const convId = parseInt(conversationId, 10);
    const conv = await chatModel.findConversation(convId, userId);
    if (!conv) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    await chatModel.updateConversationStatus(convId, "escalated");
    await chatModel.addMessage(
      convId,
      "ai",
      "Your request has been escalated to an administrator. Someone from the CSPC team will review your concern. Thank you for your patience."
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("Escalate error", { error: err.message });
    return res.status(500).json({ error: "Could not escalate conversation." });
  }
}

// ---------------------------------------------------------------
// GET /admin/chat � Admin: view all escalated conversations
// ---------------------------------------------------------------
async function adminChatList(req, res, next) {
  try {
    const conversations = await chatModel.listAllConversations();
    res.render("admin/chat-list", {
      title: "Chat Conversations � Admin",
      user: req.session.user,
      conversations,
      activePage: "admin-chat",
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// GET /admin/chat/:id � Admin: view a single conversation
// ---------------------------------------------------------------
async function adminChatDetail(req, res, next) {
  try {
    const convId = parseInt(req.params.id, 10);
    if (isNaN(convId)) {
      return res.status(404).render("errors/404", { title: "Not Found", user: req.session.user });
    }

    const conv     = await chatModel.findConversation(convId); // no userId ? admin access
    if (!conv) {
      return res.status(404).render("errors/404", { title: "Not Found", user: req.session.user });
    }
    const messages = await chatModel.getMessages(convId);

    res.render("admin/chat-detail", {
      title: `Conversation #${convId} � Admin`,
      user: req.session.user,
      conv,
      messages,
      activePage: "admin-chat",
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// POST /admin/chat/:id/reply � Admin sends a message
// ---------------------------------------------------------------
async function adminReply(req, res) {
  try {
    const convId  = parseInt(req.params.id, 10);
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    // Special sentinel: admin closing the conversation
    if (message.trim() === "__CLOSE__") {
      const conv = await chatModel.findConversation(convId);
      if (!conv) {
        return res.status(404).json({ error: "Conversation not found." });
      }
      await chatModel.updateConversationStatus(convId, "closed");
      return res.status(200).json({ success: true, closed: true });
    }

    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: "Message too long." });
    }

    const conv = await chatModel.findConversation(convId);
    if (!conv) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    await chatModel.addMessage(convId, "admin", message.trim());
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("Admin reply error", { error: err.message });
    return res.status(500).json({ error: "Could not send reply." });
  }
}

module.exports = { sendMessage, escalateConversation, adminChatList, adminChatDetail, adminReply };

