"use strict";

/**
 * controllers/feedbackController.js
 *
 * Handles the student-facing feedback workflow:
 *   - Dashboard
 *   - Submission form
 *   - POST submission
 *   - Feedback list
 *   - Feedback detail
 *
 * Requirements traced:
 *   FR-02 — Student submits feedback
 *   FR-03 — Reference number assigned automatically
 *   FR-04 — Student views only their own feedback
 *   NFR-03 — Ownership-scoped queries
 */

const feedbackModel  = require("../models/feedbackModel");
const categoryModel  = require("../models/categoryModel");
const responseModel  = require("../models/responseModel");
const { validateFeedbackSubmission } = require("../lib/validation");
const logger = require("../lib/logger");

// ---------------------------------------------------------------
// GET /student/dashboard
// ---------------------------------------------------------------
async function dashboard(req, res, next) {
  try {
    const userId = req.session.user.id;
    const [stats, recentFeedback] = await Promise.all([
      feedbackModel.studentStats(userId),
      feedbackModel.findByUserId(userId),
    ]);

    res.render("student/dashboard", {
      title: "My Dashboard — CSPC Feedback System",
      user: req.session.user,
      stats,
      // Show only the 5 most recent on the dashboard
      recentFeedback: recentFeedback.slice(0, 5),
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// GET /feedback/new
// ---------------------------------------------------------------
async function showSubmitForm(req, res, next) {
  try {
    const categories = await categoryModel.getAllActive();
    res.render("student/feedback-form", {
      title: "Submit Feedback — CSPC Feedback System",
      user: req.session.user,
      categories,
      errors: [],
      formData: {},
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// POST /feedback
// ---------------------------------------------------------------
async function submitFeedback(req, res, next) {
  try {
    const { type, categoryId, priority, subject, description, isAnonymous } = req.body;
    const userId = req.session.user.id;

    // Server-side validation
    const { valid, errors } = validateFeedbackSubmission({
      type,
      categoryId,
      priority,
      subject,
      description,
    });

    if (!valid) {
      const categories = await categoryModel.getAllActive();
      return res.status(422).render("student/feedback-form", {
        title: "Submit Feedback — CSPC Feedback System",
        user: req.session.user,
        categories,
        errors,
        formData: { type, categoryId, priority, subject, description, isAnonymous },
      });
    }

    // Verify that the selected category actually exists
    const category = await categoryModel.findById(parseInt(categoryId, 10));
    if (!category) {
      const categories = await categoryModel.getAllActive();
      return res.status(422).render("student/feedback-form", {
        title: "Submit Feedback — CSPC Feedback System",
        user: req.session.user,
        categories,
        errors: ["The selected category is not valid."],
        formData: { type, categoryId, priority, subject, description, isAnonymous },
      });
    }

    const anonymous = isAnonymous === "1" || isAnonymous === "on" || isAnonymous === true;

    const { insertId, referenceNumber } = await feedbackModel.create({
      userId,
      categoryId: parseInt(categoryId, 10),
      type,
      priority,
      subject,
      description,
      isAnonymous: anonymous,
    });

    logger.info("Feedback submitted", {
      feedbackId: insertId,
      referenceNumber,
      userId: anonymous ? "anonymous" : userId,
      type,
    });

    // POST → Redirect → GET
    req.flash("success", `Feedback submitted successfully. Your reference number is <strong>${referenceNumber}</strong>.`);

    // Anonymous feedback redirects to the student dashboard with reference number flash,
    // where it appears in their own dashboard/history while remaining anonymous to administrators.
    if (anonymous) {
      return res.redirect(303, "/student/dashboard");
    }
    return res.redirect(303, `/feedback/${insertId}`);
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// GET /feedback
// ---------------------------------------------------------------
async function listFeedback(req, res, next) {
  try {
    const userId = req.session.user.id;
    const feedbackList = await feedbackModel.findByUserId(userId);

    res.render("student/feedback-list", {
      title: "My Submissions — CSPC Feedback System",
      user: req.session.user,
      feedbackList,
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// GET /feedback/:id
// ---------------------------------------------------------------
async function feedbackDetail(req, res, next) {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    const userId     = req.session.user.id;

    if (isNaN(feedbackId)) {
      return res.status(404).render("errors/404", {
        title: "Not Found",
        user: req.session.user,
      });
    }

    // Ownership-enforced query — WHERE id = ? AND user_id = ?
    const feedback = await feedbackModel.findByIdAndUser(feedbackId, userId);

    if (!feedback) {
      return res.status(404).render("errors/404", {
        title: "Feedback Not Found",
        user: req.session.user,
      });
    }

    const [responses, statusHistory] = await Promise.all([
      responseModel.getResponses(feedbackId),
      responseModel.getStatusHistory(feedbackId),
    ]);

    res.render("student/feedback-detail", {
      title: `${feedback.reference_number} — CSPC Feedback System`,
      user: req.session.user,
      feedback,
      responses,
      statusHistory,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { dashboard, showSubmitForm, submitFeedback, listFeedback, feedbackDetail };
