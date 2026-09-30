-- Run this migration once against an existing database before deploying image attachments.
-- It only adds nullable columns and does not modify or delete existing feedback records.
ALTER TABLE feedback
  ADD COLUMN image_public_id VARCHAR(255) NULL COMMENT 'Private Cloudinary asset identifier' AFTER description,
  ADD COLUMN image_mime_type VARCHAR(50) NULL COMMENT 'Validated attachment MIME type' AFTER image_public_id;
