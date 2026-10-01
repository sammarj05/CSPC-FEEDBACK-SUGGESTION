"use strict";

/**
 * services/attachmentDeliveryService.js
 *
 * Securely retrieves private attachment images from storage
 * and streams them directly to authorized clients.
 * Protects storage credentials, avoids public asset URLs, and ensures
 * images are governed by application authentication and authorization.
 */

const attachmentStorage = require("./attachmentStorageService");

async function streamFeedbackImage(res, imagePublicId, imageMimeType) {
  const format = imageMimeType ? imageMimeType.replace("image/", "").replace("jpeg", "jpg") : undefined;
  let imageUrl = attachmentStorage.getPrivateImageUrl(imagePublicId, format);
  let imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    // If format extension url failed, retry without format extension
    imageUrl = attachmentStorage.getPrivateImageUrl(imagePublicId);
    imageResponse = await fetch(imageUrl);
  }

  if (!imageResponse.ok) {
    const error = new Error("Attachment storage could not retrieve the image.");
    error.status = 502;
    throw error;
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  res.set({
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Disposition": "inline",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
  });
  res.type(imageMimeType || "application/octet-stream");
  return res.send(imageBuffer);
}

module.exports = { streamFeedbackImage };
