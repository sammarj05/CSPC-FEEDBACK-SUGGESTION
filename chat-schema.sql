-- =============================================================
-- Aizen AI Chat — Database Schema
-- =============================================================
-- Run this against your database AFTER schema.sql
-- (tables reference users.id via FK)
--
-- Tables added:
--   chat_conversations  — one row per chat session
--   chat_messages       — one row per message
-- =============================================================

USE cspc_feedback_db_leftwayin;

-- =============================================================
-- CHAT CONVERSATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS chat_conversations (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NULL     COMMENT 'NULL for guest conversations',
    status     ENUM('active','escalated','closed') NOT NULL DEFAULT 'active',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_chat_conv_user   (user_id),
    KEY idx_chat_conv_status (status),

    CONSTRAINT fk_chat_conv_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- CHAT MESSAGES
-- =============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    conversation_id INT UNSIGNED  NOT NULL,
    sender_type     ENUM('user','ai','admin') NOT NULL,
    message         TEXT          NOT NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_chat_msg_conv (conversation_id),

    CONSTRAINT fk_chat_msg_conv
        FOREIGN KEY (conversation_id)
        REFERENCES chat_conversations (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
