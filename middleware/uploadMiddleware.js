"use strict";

/**
 * middleware/uploadMiddleware.js
 *
 * Multer in-memory storage middleware for feedback image attachments.
 * Files are held in memory only — they are validated, re-encoded by Sharp,
 * and uploaded to Cloudinary before being committed to the database.
 * Nothing is ever written to Render's ephemeral filesystem.
 */

const multer = require("multer");
const { MAX_IMAGE_SIZE_BYTES } = require("../lib/attachmentValidation");

const feedbackImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
});

function handleFeedbackImageUpload(req, res, next) {
  feedbackImageUpload.single("attachment")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        req.attachmentError = "The image must be 5 MB or smaller.";
      } else if (err instanceof multer.MulterError) {
        req.attachmentError = "Please attach only one image file.";
      } else {
        req.attachmentError = "The image could not be uploaded. Please choose a valid image and try again.";
      }
    }
    next();
  });
}

module.exports = { handleFeedbackImageUpload };
