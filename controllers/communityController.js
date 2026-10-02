"use strict";

const communityModel = require("../models/communityModel");
const { sanitize, validateCommunityComment, VALID_FEEDBACK_TYPES } = require("../lib/validation");
const logger = require("../lib/logger");

const FEED_PAGE_SIZE = 10;

function renderNotFound(req, res, title = "Community Feedback Not Found") {
  return res.status(404).render("errors/404", {
    title,
    user: req.session.user,
  });
}

function normalizedType(type) {
  return VALID_FEEDBACK_TYPES.includes(type) ? type : null;
}

async function listFeed(req, res, next) {
  try {
    const type = normalizedType(req.query.type);
    const search = sanitize(req.query.search).slice(0, 100);
    const currentPage = Math.max(1, parseInt(req.query.page, 10) || 1);
    const { rows, total } = await communityModel.listPublished({
      type,
      search: search || null,
      page: currentPage,
      perPage: FEED_PAGE_SIZE,
      userId: req.session.user.id,
    });

    res.render("student/community-feed", {
      title: "Community Feed — CSPC Feedback System",
      user: req.session.user,
      feedbackList: rows,
      filters: { type, search },
      pagination: {
        currentPage,
        totalPages: Math.ceil(total / FEED_PAGE_SIZE),
        total,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function feedbackDetail(req, res, next) {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) return renderNotFound(req, res);

    const feedback = await communityModel.findPublishedById(feedbackId, req.session.user.id);
    if (!feedback) return renderNotFound(req, res);

    const comments = await communityModel.getVisibleComments(feedbackId);
    return res.render("student/community-detail", {
      title: `${feedback.subject} — Community Feed`,
      user: req.session.user,
      feedback,
      comments,
    });
  } catch (err) {
    return next(err);
  }
}

async function reactToFeedback(req, res, next) {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) return renderNotFound(req, res);

    const result = await communityModel.setReaction({
      feedbackId,
      userId: req.session.user.id,
      reactionType: req.body.reactionType,
    });
    if (!result) {
      req.flash("error", "That reaction is not valid or the feedback is no longer published.");
      return res.redirect(303, "/community");
    }

    const label = req.body.reactionType === "support" ? "Support" : "Not Helpful";
    const message = result.action === "removed"
      ? `${label} reaction removed.`
      : result.action === "changed"
        ? `Reaction changed to ${label}.`
        : `${label} reaction added.`;
    req.flash("success", message);
    return res.redirect(303, `/community/feedback/${feedbackId}`);
  } catch (err) {
    return next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const feedbackId = parseInt(req.params.id, 10);
    if (isNaN(feedbackId)) return renderNotFound(req, res);

    const { valid, errors } = validateCommunityComment({ commentText: req.body.commentText });
    if (!valid) {
      req.flash("error", errors.join(" "));
      return res.redirect(303, `/community/feedback/${feedbackId}`);
    }

    const commentId = await communityModel.createComment({
      feedbackId,
      userId: req.session.user.id,
      commentText: sanitize(req.body.commentText),
    });
    if (!commentId) {
      req.flash("error", "This feedback is no longer available for comments.");
      return res.redirect(303, "/community");
    }

    logger.info("Community comment added", { feedbackId, commentId, userId: req.session.user.id });
    req.flash("success", "Your comment has been posted.");
    return res.redirect(303, `/community/feedback/${feedbackId}#comments`);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listFeed, feedbackDetail, reactToFeedback, addComment };
