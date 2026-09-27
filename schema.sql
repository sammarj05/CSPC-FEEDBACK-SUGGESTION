-- =============================================================
-- CSPC Suggestion & Feedback System
-- Database Schema
-- =============================================================

USE cspc_feedback_db_leftwayin;

-- =============================================================
-- USERS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100)    NOT NULL,
    email         VARCHAR(255)    NOT NULL,
    password_hash VARCHAR(255)    NULL COMMENT 'NULL for OAuth-only accounts',
    google_id     VARCHAR(100)    NULL COMMENT 'Google sub ID for OAuth login',
    avatar        VARCHAR(500)    NULL COMMENT 'Google profile picture URL',
    role          ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    student_id    VARCHAR(20)     NULL,
    department    VARCHAR(100)    NULL,
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- CATEGORIES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS categories (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)    NOT NULL,
    description TEXT            NULL,
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order  INT             NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- FEEDBACK TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS feedback (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    reference_number VARCHAR(20)     NOT NULL,
    user_id         INT UNSIGNED    NULL COMMENT 'Author user id (identity masked from admins if is_anonymous = 1)',
    category_id     INT UNSIGNED    NOT NULL,
    type            ENUM(
        'suggestion',
        'complaint',
        'concern',
        'general_feedback',
        'appreciation'
    ) NOT NULL,
    priority        ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
    subject         VARCHAR(255)    NOT NULL,
    description     TEXT            NOT NULL,
    is_anonymous    TINYINT(1)      NOT NULL DEFAULT 0,
    status          ENUM(
        'submitted',
        'under_review',
        'in_progress',
        'resolved',
        'closed'
    ) NOT NULL DEFAULT 'submitted',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_feedback_reference (reference_number),
    KEY idx_feedback_user (user_id),
    KEY idx_feedback_category (category_id),
    KEY idx_feedback_status (status),
    KEY idx_feedback_type (type),
    KEY idx_feedback_created (created_at),

    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE SET NULL,

    CONSTRAINT fk_feedback_category
        FOREIGN KEY (category_id)
        REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- FEEDBACK STATUS HISTORY TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS feedback_status_history (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    feedback_id INT UNSIGNED    NOT NULL,
    changed_by  INT UNSIGNED    NULL COMMENT 'admin user id',
    old_status  ENUM(
        'submitted',
        'under_review',
        'in_progress',
        'resolved',
        'closed'
    ) NULL,
    new_status  ENUM(
        'submitted',
        'under_review',
        'in_progress',
        'resolved',
        'closed'
    ) NOT NULL,
    note        TEXT            NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_history_feedback (feedback_id),

    CONSTRAINT fk_history_feedback
        FOREIGN KEY (feedback_id)
        REFERENCES feedback (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_history_admin
        FOREIGN KEY (changed_by)
        REFERENCES users (id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- FEEDBACK RESPONSES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS feedback_responses (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    feedback_id INT UNSIGNED    NOT NULL,
    admin_id    INT UNSIGNED    NULL,
    message     TEXT            NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_responses_feedback (feedback_id),

    CONSTRAINT fk_responses_feedback
        FOREIGN KEY (feedback_id)
        REFERENCES feedback (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_responses_admin
        FOREIGN KEY (admin_id)
        REFERENCES users (id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;