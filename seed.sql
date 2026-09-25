-- =============================================================
-- CSPC Suggestion & Feedback System
-- Seed Data
-- =============================================================

USE cspc_feedback_db;

-- =============================================================
-- CATEGORIES SEED
-- =============================================================
INSERT IGNORE INTO categories (name, description, sort_order) VALUES
  ('Academic',        'Concerns related to courses, curriculum, and academic policies', 1),
  ('Facilities',      'Issues with classrooms, laboratories, and physical infrastructure', 2),
  ('Student Services','Concerns about registrar, guidance, scholarships, and support services', 3),
  ('Faculty',         'Feedback about teaching staff and their conduct', 4),
  ('Administration',  'Concerns about college administration and governance', 5),
  ('Technology',      'Issues with ICT systems, internet, and digital tools', 6),
  ('Campus Safety',   'Safety and security concerns within CSPC premises', 7),
  ('Events',          'Feedback about campus events, activities, and programs', 8),
  ('Other',           'General feedback that does not fit other categories', 9);

-- =============================================================
-- DEFAULT ADMIN ACCOUNT
-- password: Admin@CSPC2026  (bcrypt hash below)
-- CHANGE THIS PASSWORD IMMEDIATELY AFTER DEPLOYMENT
-- =============================================================
INSERT IGNORE INTO users (name, email, password_hash, role, department) VALUES
  (
    'System Administrator',
    'admin@cspc.edu.ph',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxR.xQ1HAlQ6Q0BaBQEBi5nVYYe',
    'admin',
    'CSPC ICT Office'
  );
