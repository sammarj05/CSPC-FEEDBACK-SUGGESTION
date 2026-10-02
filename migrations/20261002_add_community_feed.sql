-- ==============================================================================
-- Migration: Add Community Feed publication, reactions, and comments
-- Date: 2026-10-02
-- Description: Adds an explicit, admin-controlled publication state to feedback
-- records and the tables needed for community reactions and comments.
-- This migration is non-destructive: existing feedback remains unpublished.
-- Run once against the existing CSPC MySQL database.
-- ==============================================================================

ALTER TABLE feedback
  ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Explicit community-feed visibility approval' AFTER status,
  ADD COLUMN published_at DATETIME NULL AFTER is_published,
  ADD COLUMN published_by INT UNSIGNED NULL
    COMMENT 'Administrator who most recently published the feedback' AFTER published_at,
  ADD KEY idx_feedback_community_feed (is_published, published_at),
  ADD CONSTRAINT fk_feedback_published_by
    FOREIGN KEY (published_by)
    REFERENCES users (id)
    ON DELETE SET NULL;

CREATE TABLE feedback_reactions (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    feedback_id   INT UNSIGNED NOT NULL,
    user_id       INT UNSIGNED NOT NULL,
    reaction_type ENUM('support', 'not_helpful') NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_feedback_reactions_feedback_user (feedback_id, user_id),
    KEY idx_feedback_reactions_feedback_type (feedback_id, reaction_type),
    KEY idx_feedback_reactions_user (user_id),

    CONSTRAINT fk_feedback_reactions_feedback
      FOREIGN KEY (feedback_id)
      REFERENCES feedback (id)
      ON DELETE CASCADE,

    CONSTRAINT fk_feedback_reactions_user
      FOREIGN KEY (user_id)
      REFERENCES users (id)
      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feedback_comments (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    feedback_id  INT UNSIGNED NOT NULL,
    user_id      INT UNSIGNED NOT NULL,
    comment_text VARCHAR(500) NOT NULL,
    is_hidden    TINYINT(1) NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_feedback_comments_feed_visibility (feedback_id, is_hidden, created_at),
    KEY idx_feedback_comments_user (user_id),

    CONSTRAINT fk_feedback_comments_feedback
      FOREIGN KEY (feedback_id)
      REFERENCES feedback (id)
      ON DELETE CASCADE,

    CONSTRAINT fk_feedback_comments_user
      FOREIGN KEY (user_id)
      REFERENCES users (id)
      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
