"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";
const sharp = require("sharp");
const request = require("supertest");
const app = require("../app");
const {
  validateAndNormalizeImage,
  AttachmentValidationError,
  MAX_IMAGE_SIZE_BYTES,
} = require("../lib/attachmentValidation");
const attachmentStorage = require("../services/attachmentStorageService");

describe("Attachment Validation — lib/attachmentValidation", () => {
  it("returns null when no file is provided", async () => {
    const result = await validateAndNormalizeImage(null);
    expect(result).toBeNull();
  });

  it("rejects files exceeding 5MB", async () => {
    const fakeFile = {
      size: MAX_IMAGE_SIZE_BYTES + 1,
      mimetype: "image/jpeg",
      buffer: Buffer.alloc(10),
    };
    await expect(validateAndNormalizeImage(fakeFile)).rejects.toThrow(
      "The image must be 5 MB or smaller."
    );
  });

  it("rejects non-whitelisted client MIME types", async () => {
    const fakeFile = {
      size: 1024,
      mimetype: "application/pdf",
      buffer: Buffer.alloc(1024),
    };
    await expect(validateAndNormalizeImage(fakeFile)).rejects.toThrow(
      "Only JPG, JPEG, PNG, and WebP images are allowed."
    );
  });

  it("rejects invalid/corrupt image data even if client claims image/jpeg", async () => {
    const fakeFile = {
      size: 1024,
      mimetype: "image/jpeg",
      buffer: Buffer.from("NOT_AN_IMAGE_FILE_JUST_TEXT"),
    };
    await expect(validateAndNormalizeImage(fakeFile)).rejects.toThrow(
      "The selected file is not a valid image."
    );
  });

  it("successfully validates and normalizes a real PNG image buffer", async () => {
    const samplePng = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const file = {
      size: samplePng.length,
      mimetype: "image/png",
      buffer: samplePng,
    };

    const result = await validateAndNormalizeImage(file);
    expect(result).toBeDefined();
    expect(result.format).toBe("png");
    expect(result.mimeType).toBe("image/png");
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it("successfully validates and normalizes a real JPEG image buffer", async () => {
    const sampleJpg = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 0, g: 128, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    const file = {
      size: sampleJpg.length,
      mimetype: "image/jpeg",
      buffer: sampleJpg,
    };

    const result = await validateAndNormalizeImage(file);
    expect(result).toBeDefined();
    expect(result.format).toBe("jpeg");
    expect(result.mimeType).toBe("image/jpeg");
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
  });
});

describe("Attachment Storage Service — services/attachmentStorageService", () => {
  it("correctly identifies unconfigured state when environment variables are missing", () => {
    const origCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const origApiKey = process.env.CLOUDINARY_API_KEY;
    const origApiSecret = process.env.CLOUDINARY_API_SECRET;
    const origUrl = process.env.CLOUDINARY_URL;

    try {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;
      delete process.env.CLOUDINARY_URL;

      expect(attachmentStorage.isConfigured()).toBe(false);
    } finally {
      if (origCloudName) process.env.CLOUDINARY_CLOUD_NAME = origCloudName;
      if (origApiKey) process.env.CLOUDINARY_API_KEY = origApiKey;
      if (origApiSecret) process.env.CLOUDINARY_API_SECRET = origApiSecret;
      if (origUrl) process.env.CLOUDINARY_URL = origUrl;
    }
  });

  it("identifies configured state when CLOUDINARY_URL is present", () => {
    const origUrl = process.env.CLOUDINARY_URL;
    try {
      process.env.CLOUDINARY_URL = "cloudinary://123:abc@testcloud";
      expect(attachmentStorage.isConfigured()).toBe(true);
    } finally {
      if (origUrl) process.env.CLOUDINARY_URL = origUrl;
      else delete process.env.CLOUDINARY_URL;
    }
  });

  it("handles deleteFeedbackImage gracefully when null or empty", async () => {
    await expect(attachmentStorage.deleteFeedbackImage(null)).resolves.not.toThrow();
    await expect(attachmentStorage.deleteFeedbackImage("")).resolves.not.toThrow();
  });
});

describe("Attachment Route Authorization", () => {
  it("GET /feedback/:id/image redirects unauthenticated student to login", async () => {
    const res = await request(app).get("/feedback/1/image");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/);
  });

  it("GET /admin/feedback/:id/image rejects unauthenticated access", async () => {
    const res = await request(app).get("/admin/feedback/1/image");
    expect([302, 401, 403]).toContain(res.status);
  });
});
