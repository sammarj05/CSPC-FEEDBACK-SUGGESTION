"use strict";

const { randomUUID } = require("crypto");
const cloudinary = require("../config/cloudinary");

const REQUIRED_CONFIGURATION = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

function isConfigured() {
  return REQUIRED_CONFIGURATION.every((key) => Boolean(process.env[key]));
}

function requireConfiguration() {
  if (!isConfigured()) {
    const error = new Error("Image attachment storage is unavailable. Please try again later.");
    error.status = 503;
    throw error;
  }
}

function uploadFeedbackImage({ buffer, format }) {
  requireConfiguration();

  const publicId = `feedback/${randomUUID()}`;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        type: "private",
        format,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve({ publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function deleteFeedbackImage(publicId) {
  if (!publicId || !isConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      type: "private",
      invalidate: true,
    });
  } catch (_err) {
    // Cleanup failures are intentionally not surfaced after the original request failure.
  }
}

function getPrivateImageUrl(publicId) {
  requireConfiguration();
  return cloudinary.url(publicId, {
    resource_type: "image",
    type: "private",
    secure: true,
    sign_url: true,
  });
}

module.exports = {
  uploadFeedbackImage,
  deleteFeedbackImage,
  getPrivateImageUrl,
};
