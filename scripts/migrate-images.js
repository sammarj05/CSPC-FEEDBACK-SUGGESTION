"use strict";

/**
 * scripts/migrate-images.js
 *
 * Safe, idempotent migration runner for image attachments.
 * Connects using the configured database environment variables.
 * Checks whether columns already exist before modifying the schema.
 */

const db = require("../config/database");

async function runMigration() {
  console.log("[Migration] Checking database schema for feedback image attachment columns...");
  try {
    const [cols] = await db.query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'feedback'
         AND COLUMN_NAME IN ('image_public_id', 'image_mime_type')`
    );

    const existing = cols.map((c) => c.COLUMN_NAME);

    if (!existing.includes("image_public_id")) {
      console.log("[Migration] Adding column 'image_public_id' to feedback table...");
      await db.query(
        `ALTER TABLE feedback
         ADD COLUMN image_public_id VARCHAR(255) NULL
         COMMENT 'Private Cloudinary asset identifier'
         AFTER description`
      );
      console.log("[Migration] Column 'image_public_id' added successfully.");
    } else {
      console.log("[Migration] Column 'image_public_id' already exists. Skipping.");
    }

    if (!existing.includes("image_mime_type")) {
      console.log("[Migration] Adding column 'image_mime_type' to feedback table...");
      await db.query(
        `ALTER TABLE feedback
         ADD COLUMN image_mime_type VARCHAR(50) NULL
         COMMENT 'Validated attachment MIME type'
         AFTER image_public_id`
      );
      console.log("[Migration] Column 'image_mime_type' added successfully.");
    } else {
      console.log("[Migration] Column 'image_mime_type' already exists. Skipping.");
    }

    console.log("[Migration] All migrations completed successfully.");
  } catch (err) {
    console.error("[Migration] Error applying migration:", err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

runMigration();
