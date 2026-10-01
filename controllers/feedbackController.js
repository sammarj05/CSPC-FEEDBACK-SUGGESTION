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
const { AttachmentValidationError, validateAndNormalizeImage } = require("../lib/attachmentValidation");
const attachmentStorage = require("../services/attachmentStorageService");
const { streamFeedbackImage } = require("../services/attachmentDeliveryService");
const logger = require("../lib/logger");

function renderSubmitForm(req, res, { errors, formData, categories }) {
  return res.status(422).render("student/feedback-form", {
    title: "Submit Feedback — CSPC Feedback System",
    user: req.session.user,
    categories,
    errors,
    formData,
  });
}

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
  let uploadedImagePublicId = null;

  try {
    const { type, categoryId, priority, subject, description, isAnonymous } = req.body;
    const userId = req.session.user.id;
    const formData = { type, categoryId, priority, subject, description, isAnonymous };

    // Report multer errors surfaced by the upload middleware
    if (req.attachmentError) {
      const categories = await categoryModel.getAllActive();
      return renderSubmitForm(req, res, { errors: [req.attachmentError], formData, categories });
    }

    // Server-side validation
    const { valid, errors } = validateFeedbackSubmission({
      type, categoryId, priority, subject, description,
    });

    if (!valid) {
      const categories = await categoryModel.getAllActive();
      return renderSubmitForm(req, res, { errors, formData, categories });
    }

    // Verify that the selected category actually exists
    const category = await categoryModel.findById(parseInt(categoryId, 10));
    if (!category) {
      const categories = await categoryModel.getAllActive();
      return renderSubmitForm(req, res, {
        errors: ["The selected category is not valid."],
        formData,
        categories,
      });
    }

    const anonymous = isAnonymous === "1" || isAnonymous === "on" || isAnonymous === true;
    let attachment = null;

    // Process image attachment if one was uploaded
    if (req.file) {
      try {
        const normalized = await validateAndNormalizeImage(req.file);
        const stored = await attachmentStorage.uploadFeedbackImage(normalized);
        uploadedImagePublicId = stored.publicId;
        attachment = { publicId: stored.publicId, mimeType: normalized.mimeType };
      } catch (err) {
        if (err instanceof AttachmentValidationError || err.status === 503) {
          const categories = await categoryModel.getAllActive();
          return renderSubmitForm(req, res, { errors: [err.message], formData, categories });
        }
        logger.error("Feedback attachment upload failed", { message: err.message });
        const categories = await categoryModel.getAllActive();
        return renderSubmitForm(req, res, {
          errors: ["The image could not be stored. Please try again later or submit without an image."],
          formData,
          categories,
        });
      }
    }

    const { insertId, referenceNumber } = await feedbackModel.create({
      userId,
      categoryId: parseInt(categoryId, 10),
      type,
      priority,
      subject,
      description,
      isAnonymous: anonymous,
      imagePublicId: attachment ? attachment.publicId : null,
      imageMimeType: attachment ? attachment.mimeType : null,
    });
    // Image is now committed — safe to clear the rollback guard
    uploadedImagePublicId = null;

    logger.info("Feedback submitted", {
      feedbackId: insertId,
      referenceNumber,
      userId: anonymous ? "anonymous" : userId,
      type,
      hasImage: Boolean(attachment),
    });

    // POST → Redirect → GET
    req.flash("success", `Feedback submitted successfully. Your reference number is <strong>${referenceNumber}</strong>.`);

    // Anonymous feedback redirects to the student dashboard with reference number flash.
    if (anonymous) {
      return res.redirect(303, "/student/dashboard");
    }
    return res.redirect(303, `/feedback/${insertId}`);
  } catch (err) {
    // If the DB write failed after a successful upload, clean up the orphaned Cloudinary asset.
    if (uploadedImagePublicId) {
      await attachmentStorage.deleteFeedbackImage(uploadedImagePublicId);
    }
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

// ---------------------------------------------------------------
// GET /feedback/:id/image  — owner-only image stream
// ---------------------------------------------------------------
async function feedbackImage(req, res, next) {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) {
      return res.status(404).render("errors/404", { title: "Not Found", user: req.session.user });
    }

    // Ownership-enforced — only the submitter may retrieve their own attachment.
    const feedback = await feedbackModel.findByIdAndUser(feedbackId, req.session.user.id);
    if (!feedback || !feedback.image_public_id || !feedback.image_mime_type) {
      return res.status(404).render("errors/404", { title: "Attachment Not Found", user: req.session.user });
    }

    return streamFeedbackImage(res, feedback.image_public_id, feedback.image_mime_type);
  } catch (err) {
    return next(err);
  }
}

module.exports = { dashboard, showSubmitForm, submitFeedback, listFeedback, feedbackDetail, feedbackImage };
