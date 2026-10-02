"use strict";

/**
 * controllers/adminController.js
 *
 * Admin-only actions: dashboard, feedback management,
 * status changes, and responding to feedback.
 *
 * All routes are protected by requireLogin + requireRole("admin")
 * in the route definitions — server-side enforcement.
 *
 * Requirements traced:
 *   FR-05 — Admin updates feedback status
 *   FR-06 — Admin responds to feedback
 */

const feedbackModel  = require("../models/feedbackModel");
const responseModel  = require("../models/responseModel");
const categoryModel  = require("../models/categoryModel");
const communityModel = require("../models/communityModel");
const { validateAdminResponse, validateStatusChange, sanitize } = require("../lib/validation");
const { streamFeedbackImage } = require("../services/attachmentDeliveryService");
const logger = require("../lib/logger");

const VALID_STATUSES = ["submitted", "under_review", "in_progress", "resolved", "closed"];

// ---------------------------------------------------------------
// GET /admin/dashboard
// ---------------------------------------------------------------
async function dashboard(req, res, next) {
  try {
    const stats = await feedbackModel.adminStats();
    res.render("admin/dashboard", {
      title: "Admin Dashboard — CSPC Feedback System",
      user: req.session.user,
      stats,
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// GET /admin/feedback
// ---------------------------------------------------------------
async function listFeedback(req, res, next) {
  try {
    const { status, categoryId, type, priority, search, page } = req.query;
    const categories = await categoryModel.getAllActive();

    const currentPage = Math.max(1, parseInt(page, 10) || 1);

    const { rows, total } = await feedbackModel.adminList({
      status:     status     || null,
      categoryId: categoryId || null,
      type:       type       || null,
      priority:   priority   || null,
      search:     search     ? sanitize(search) : null,
      page:       currentPage,
      perPage:    15,
    });

    const totalPages = Math.ceil(total / 15);

    res.render("admin/feedback-list", {
      title: "Feedback Management — CSPC Feedback System",
      user: req.session.user,
      feedbackList: rows,
      categories,
      filters: { status, categoryId, type, priority, search },
      pagination: { currentPage, totalPages, total },
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// GET /admin/feedback/:id
// ---------------------------------------------------------------
async function feedbackDetail(req, res, next) {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) {
      return res.status(404).render("errors/404", { title: "Not Found", user: req.session.user });
    }

    const feedback = await feedbackModel.findByIdAdmin(feedbackId);
    if (!feedback) {
      return res.status(404).render("errors/404", { title: "Feedback Not Found", user: req.session.user });
    }

    const [responses, statusHistory, categories] = await Promise.all([
      responseModel.getResponses(feedbackId),
      responseModel.getStatusHistory(feedbackId),
      categoryModel.getAllActive(),
    ]);

    res.render("admin/feedback-detail", {
      title: `${feedback.reference_number} — Admin — CSPC Feedback System`,
      user: req.session.user,
      feedback,
      responses,
      statusHistory,
      categories,
      validStatuses: VALID_STATUSES,
      errors: [],
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// POST /admin/feedback/:id/status
// ---------------------------------------------------------------
async function updateStatus(req, res, next) {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) {
      return res.status(400).json({ error: "Invalid feedback ID." });
    }

    const { status, note } = req.body;
    const { valid, errors } = validateStatusChange({ status });

    if (!valid) {
      req.flash("error", errors.join(" "));
      return res.redirect(303, `/admin/feedback/${feedbackId}`);
    }

    const adminId = req.session.user.id;
    const updated = await feedbackModel.updateStatus(feedbackId, status, adminId, note ? sanitize(note) : null);

    if (!updated) {
      req.flash("error", "Feedback record not found.");
      return res.redirect(303, "/admin/feedback");
    }

    logger.info("Status updated", { feedbackId, newStatus: status, adminId });
    req.flash("success", `Status updated to "${status.replace(/_/g, " ")}".`);
    return res.redirect(303, `/admin/feedback/${feedbackId}`);
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// POST /admin/feedback/:id/respond
// ---------------------------------------------------------------
async function addResponse(req, res, next) {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) {
      return res.status(400).end();
    }

    const { message } = req.body;
    const { valid, errors } = validateAdminResponse({ message });

    if (!valid) {
      req.flash("error", errors.join(" "));
      return res.redirect(303, `/admin/feedback/${feedbackId}`);
    }

    const adminId = req.session.user.id;

    await responseModel.createResponse({
      feedbackId,
      adminId,
      message: sanitize(message),
    });

    logger.info("Admin responded", { feedbackId, adminId });
    req.flash("success", "Response added successfully.");
    return res.redirect(303, `/admin/feedback/${feedbackId}`);
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// POST /admin/feedback/:id/publication
// ---------------------------------------------------------------
async function updatePublication(req, res, next) {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    const isPublished = req.body.isPublished;
    if (isNaN(feedbackId) || !["0", "1"].includes(isPublished)) {
      req.flash("error", "Invalid publication request.");
      return res.redirect(303, "/admin/feedback");
    }

    const updated = await communityModel.setPublication({
      feedbackId,
      isPublished: isPublished === "1",
      adminId: req.session.user.id,
    });
    if (!updated) {
      req.flash("error", "Feedback record not found.");
      return res.redirect(303, "/admin/feedback");
    }

    const message = isPublished === "1"
      ? "Feedback published to the Community Feed."
      : "Feedback removed from the Community Feed.";
    logger.info("Community publication updated", {
      feedbackId,
      isPublished: isPublished === "1",
      adminId: req.session.user.id,
    });
    req.flash("success", message);
    return res.redirect(303, `/admin/feedback/${feedbackId}`);
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// GET /admin/community/comments
// ---------------------------------------------------------------
async function listCommunityComments(req, res, next) {
  try {
    const currentPage = Math.max(1, parseInt(req.query.page, 10) || 1);
    const { rows, total } = await communityModel.adminComments({
      page: currentPage,
      perPage: 20,
    });
    return res.render("admin/community-comments", {
      title: "Community Comment Moderation — CSPC Feedback System",
      user: req.session.user,
      comments: rows,
      pagination: {
        currentPage,
        totalPages: Math.ceil(total / 20),
        total,
      },
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// POST /admin/community/comments/:id/visibility
// ---------------------------------------------------------------
async function updateCommentVisibility(req, res, next) {
  try {
    const commentId = parseInt(req.params.id, 10);
    const isHidden = req.body.isHidden;
    if (isNaN(commentId) || !["0", "1"].includes(isHidden)) {
      req.flash("error", "Invalid comment moderation request.");
      return res.redirect(303, "/admin/community/comments");
    }

    const updated = await communityModel.setCommentVisibility(commentId, isHidden === "1");
    if (!updated) {
      req.flash("error", "Comment not found.");
      return res.redirect(303, "/admin/community/comments");
    }

    req.flash("success", isHidden === "1" ? "Comment hidden from students." : "Comment restored for students.");
    return res.redirect(303, "/admin/community/comments");
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// GET /admin/feedback/:id/image  — admin image stream
// ---------------------------------------------------------------
async function feedbackImage(req, res, next) {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) {
      return res.status(404).render("errors/404", { title: "Not Found", user: req.session.user });
    }

    // Admin may view any feedback image (admin route is already protected by requireRole).
    const feedback = await feedbackModel.findByIdAdmin(feedbackId);
    if (!feedback || !feedback.image_public_id || !feedback.image_mime_type) {
      return res.status(404).render("errors/404", { title: "Attachment Not Found", user: req.session.user });
    }

    return streamFeedbackImage(res, feedback.image_public_id, feedback.image_mime_type);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  dashboard,
  listFeedback,
  feedbackDetail,
  feedbackImage,
  updateStatus,
  addResponse,
  updatePublication,
  listCommunityComments,
  updateCommentVisibility,
};
