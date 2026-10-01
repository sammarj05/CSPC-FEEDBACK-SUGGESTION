"use strict";

/**
 * config/cloudinary.js
 *
 * Cloudinary v2 SDK configuration for persistent feedback image storage.
 * Works seamlessly with Render's ephemeral filesystem constraints.
 *
 * Supports configuration via either:
 *  - Individual variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *  - Or full connection string: CLOUDINARY_URL
 */

const cloudinary = require("cloudinary").v2;

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

module.exports = cloudinary;
