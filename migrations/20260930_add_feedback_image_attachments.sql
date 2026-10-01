-- ==============================================================================
-- Migration: Add image attachment columns to feedback table
-- Date: 2026-09-30
-- Description: Adds nullable image_public_id and image_mime_type columns to the
--              feedback table. This migration is completely safe and non-destructive:
--              - Existing feedback records are preserved with NULL values.
--              - Existing table relationships and foreign keys are unchanged.
-- ==============================================================================

ALTER TABLE feedback
  ADD COLUMN image_public_id VARCHAR(255) NULL COMMENT 'Private Cloudinary asset identifier' AFTER description,
  ADD COLUMN image_mime_type VARCHAR(50)  NULL COMMENT 'Validated attachment MIME type' AFTER image_public_id;
