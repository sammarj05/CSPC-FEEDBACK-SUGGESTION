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

// Submit feedback
// POST /feedback
router.post("/feedback", requireLogin, submitLimiter, feedbackCtrl.submitFeedback);

// Feedback list (own submissions only)
// GET /feedback
router.get("/feedback", requireLogin, feedbackCtrl.listFeedback);

// Feedback detail (ownership-scoped)
// GET /feedback/:id
router.get("/feedback/:id", requireLogin, feedbackCtrl.feedbackDetail);

module.exports = router;
