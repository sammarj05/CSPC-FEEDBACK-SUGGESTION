"use strict";

const express = require("express");
const rateLimit = require("express-rate-limit");
const communityCtrl = require("../controllers/communityController");
const { requireLogin, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

const reactionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many reactions. Please wait before trying again.",
});

const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many comments. Please wait before posting again.",
});

router.use(requireLogin, requireRole("student"));

router.get("/", communityCtrl.listFeed);
router.get("/feedback/:id", communityCtrl.feedbackDetail);
router.post("/feedback/:id/reaction", reactionLimiter, communityCtrl.reactToFeedback);
router.post("/feedback/:id/comments", commentLimiter, communityCtrl.addComment);

module.exports = router;
