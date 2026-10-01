"use strict";

/**
 * lib/attachmentValidation.js
 *
 * Strict image validation and normalization for feedback attachments.
 * - Enforces 5 MB file size limit
 * - Rejects files based on magic bytes, not client MIME or extension alone
 * - Limits input dimensions to prevent decompression bombs
 * - Strips EXIF metadata via Sharp to protect anonymous feedback privacy
 */

const sharp = require("sharp");

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const ALLOWED_MIME_TYPES = new Map([
  ["image/jpeg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

class AttachmentValidationError extends Error {}

async function validateAndNormalizeImage(file) {
  if (!file) return null;

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new AttachmentValidationError("The image must be 5 MB or smaller.");
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new AttachmentValidationError("Only JPG, JPEG, PNG, and WebP images are allowed.");
  }

  let metadata;
  try {
    metadata = await sharp(file.buffer, {
      failOn: "error",
      limitInputPixels: MAX_IMAGE_PIXELS,
    }).metadata();
  } catch (_err) {
    throw new AttachmentValidationError("The selected file is not a valid image.");
  }

  const format = metadata.format === "jpg" ? "jpeg" : metadata.format;
  if (!ALLOWED_MIME_TYPES.has(`image/${format}`) || !metadata.width || !metadata.height) {
    throw new AttachmentValidationError("Only JPG, JPEG, PNG, and WebP images are allowed.");
  }

  try {
    const buffer = await sharp(file.buffer, {
      failOn: "error",
      limitInputPixels: MAX_IMAGE_PIXELS,
    })
      .rotate()
      .toFormat(format)
      .toBuffer();

    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new AttachmentValidationError("The image must be 5 MB or smaller.");
    }

    return { buffer, format, mimeType: `image/${format}` };
  } catch (err) {
    if (err instanceof AttachmentValidationError) throw err;
    throw new AttachmentValidationError("The selected file could not be processed as an image.");
  }
}

module.exports = {
  MAX_IMAGE_SIZE_BYTES,
  AttachmentValidationError,
  validateAndNormalizeImage,
};
