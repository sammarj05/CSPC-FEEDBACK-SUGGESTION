"use strict";

/**
 * routes/feedbackRoutes.js
 *
 * Student feedback routes.
 * All routes require authentication via requireLogin.
 * Dashboard route also requires role === "student".
 */

const express      = require("express");
const rateLimit    = require("express-rate-limit");
const feedbackCtrl = require("../controllers/feedbackController");
const { requireLogin, requireRole } = require("../middleware/authMiddleware");
const { handleFeedbackImageUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Rate limiter for feedback submission: max 5 per 10 minutes per IP
const submitLimiter = rateLimit({
  windowMs:         10 * 60 * 1000,
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          "Too many submissions. Please wait before submitting again.",
});

// Student dashboard
// GET /student/dashboard
router.get(
  "/student/dashboard",
  requireLogin,
  requireRole("student"),
  feedbackCtrl.dashboard
);

// Feedback form
// GET /feedback/new
router.get("/feedback/new", requireLogin, feedbackCtrl.showSubmitForm);

// Submit feedback (multipart/form-data for optional image attachment)
// POST /feedback
router.post("/feedback", requireLogin, submitLimiter, handleFeedbackImageUpload, feedbackCtrl.submitFeedback);

// Feedback list (own submissions only)
// GET /feedback
router.get("/feedback", requireLogin, feedbackCtrl.listFeedback);

// Attached image — owner-only (must be before :id wildcard)
// GET /feedback/:id/image
router.get("/feedback/:id/image", requireLogin, feedbackCtrl.feedbackImage);

// Feedback detail (ownership-scoped)
// GET /feedback/:id
router.get("/feedback/:id", requireLogin, feedbackCtrl.feedbackDetail);

module.exports = router;
