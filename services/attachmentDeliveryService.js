"use strict";

const attachmentStorage = require("./attachmentStorageService");

async function streamFeedbackImage(res, imagePublicId, imageMimeType) {
  const imageUrl = attachmentStorage.getPrivateImageUrl(imagePublicId);
  const imageResponse = await fetch(imageUrl);

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
  res.type(imageMimeType);
  return res.send(imageBuffer);
}

module.exports = { streamFeedbackImage };
