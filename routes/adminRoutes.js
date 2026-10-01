"use strict";

/**
 * routes/adminRoutes.js
 *
 * Admin-only routes.
 * ALL routes protected by requireLogin + requireRole("admin").
 * A student who manually navigates to /admin/* is rejected server-side.
 *
 * Requirements traced:
 *   NFR-02 — Protected routes require authentication + correct role
 */

const express    = require("express");
const adminCtrl  = require("../controllers/adminController");
const { requireLogin, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Apply auth + role guard to all admin routes
router.use(requireLogin, requireRole("admin"));

// Admin dashboard
// GET /admin/dashboard
router.get("/dashboard", adminCtrl.dashboard);

// Feedback management list
// GET /admin/feedback
router.get("/feedback", adminCtrl.listFeedback);

// Attached image — admin (must be before :id wildcard)
// GET /admin/feedback/:id/image
router.get("/feedback/:id/image", adminCtrl.feedbackImage);

// Feedback detail
// GET /admin/feedback/:id
router.get("/feedback/:id", adminCtrl.feedbackDetail);


// Update feedback status
// POST /admin/feedback/:id/status
router.post("/feedback/:id/status", adminCtrl.updateStatus);

// Add admin response
// POST /admin/feedback/:id/respond
router.post("/feedback/:id/respond", adminCtrl.addResponse);

module.exports = router;
