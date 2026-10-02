"use strict";

/**
 * lib/validation.js
 *
 * Pure validation functions — no Express or database dependencies.
 * These are exported for use in both middleware and Vitest unit tests.
 *
 * All functions return { valid: boolean, errors: string[] }
 *
 * Requirements traced:
 *   FR-02  — Feedback type/category/priority must be valid controlled values
 *   NFR-01 — Passwords are validated before hashing
 */

// ---------------------------------------------------------------
// Controlled value allow-lists
// ---------------------------------------------------------------
const VALID_FEEDBACK_TYPES = [
  "suggestion",
  "complaint",
  "concern",
  "general_feedback",
  "appreciation",
];

const VALID_PRIORITIES = ["low", "medium", "high"];

const VALID_STATUSES = [
  "submitted",
  "under_review",
  "in_progress",
  "resolved",
  "closed",
];

// ---------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------

/**
 * Returns the trimmed value if the input is a non-empty string,
 * otherwise returns an empty string.
 */
function sanitize(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

/**
 * Validates a text field against length bounds.
 * @param {string} value
 * @param {string} fieldName
 * @param {number} min
 * @param {number} max
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateText(value, fieldName, min = 1, max = 255) {
  const errors = [];
  const trimmed = sanitize(value);
  if (trimmed.length === 0) {
    errors.push(`${fieldName} is required.`);
  } else if (trimmed.length < min) {
    errors.push(`${fieldName} must be at least ${min} character(s).`);
  } else if (trimmed.length > max) {
    errors.push(`${fieldName} must not exceed ${max} characters.`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validates that a value is one of an allow-listed set.
 * @param {string} value
 * @param {string} fieldName
 * @param {string[]} allowList
 */
function validateEnum(value, fieldName, allowList) {
  const errors = [];
  if (!allowList.includes(value)) {
    errors.push(`${fieldName} contains an invalid value.`);
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------
// Email
// ---------------------------------------------------------------

/**
 * Validates an email address.
 * Uses a strict-enough regex for institutional use.
 */
function validateEmail(email) {
  const errors = [];
  const trimmed = sanitize(email);
  if (trimmed.length === 0) {
    errors.push("Email address is required.");
    return { valid: false, errors };
  }
  // RFC 5322 simplified — sufficient for server-side validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    errors.push("Email address is not valid.");
  }
  if (trimmed.length > 255) {
    errors.push("Email address must not exceed 255 characters.");
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------
// Password
// ---------------------------------------------------------------

/**
 * Validates a registration password.
 * Min 8 characters. Must contain at least one letter and one digit.
 */
function validatePassword(password) {
  const errors = [];
  if (typeof password !== "string" || password.length === 0) {
    errors.push("Password is required.");
    return { valid: false, errors };
  }
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }
  if (password.length > 128) {
    errors.push("Password must not exceed 128 characters.");
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Password must contain at least one letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------
// Registration
// ---------------------------------------------------------------

/**
 * Validates all registration fields.
 * @param {{ name, email, password, confirmPassword, studentId, department }} data
 */
function validateRegistration({ name, email, password, confirmPassword, studentId, department }) {
  const allErrors = [];

  // Name — allow apostrophes, hyphens, ñ, spaces
  const nameResult = validateText(name, "Full name", 2, 100);
  allErrors.push(...nameResult.errors);

  const emailResult = validateEmail(email);
  allErrors.push(...emailResult.errors);

  const passwordResult = validatePassword(password);
  allErrors.push(...passwordResult.errors);

  if (typeof confirmPassword === "string" && password !== confirmPassword) {
    allErrors.push("Passwords do not match.");
  }

  // studentId — optional but validated if provided
  if (sanitize(studentId).length > 0) {
    const sidResult = validateText(studentId, "Student ID", 1, 20);
    allErrors.push(...sidResult.errors);
  }

  // department — optional
  if (sanitize(department).length > 0) {
    const deptResult = validateText(department, "Department", 1, 100);
    allErrors.push(...deptResult.errors);
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

// ---------------------------------------------------------------
// Login
// ---------------------------------------------------------------

/**
 * Validates login fields (only presence; content errors are
 * surfaced as a generic auth error to prevent enumeration).
 */
function validateLogin({ email, password }) {
  const errors = [];
  if (sanitize(email).length === 0) errors.push("Email address is required.");
  if (typeof password !== "string" || password.length === 0)
    errors.push("Password is required.");
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------
// Feedback Submission
// ---------------------------------------------------------------

/**
 * Validates a feedback submission.
 * @param {{ type, categoryId, priority, subject, description }} data
 */
function validateFeedbackSubmission({ type, categoryId, priority, subject, description }) {
  const allErrors = [];

  const typeResult = validateEnum(type, "Feedback type", VALID_FEEDBACK_TYPES);
  allErrors.push(...typeResult.errors);

  // categoryId — must be a positive integer (foreign-key existence
  // is checked at the DB layer)
  const catId = parseInt(categoryId, 10);
  if (isNaN(catId) || catId < 1) {
    allErrors.push("A valid category is required.");
  }

  const priorityResult = validateEnum(priority, "Priority", VALID_PRIORITIES);
  allErrors.push(...priorityResult.errors);

  const subjectResult = validateText(subject, "Subject", 5, 255);
  allErrors.push(...subjectResult.errors);

  const descResult = validateText(description, "Description", 10, 5000);
  allErrors.push(...descResult.errors);

  return { valid: allErrors.length === 0, errors: allErrors };
}

// ---------------------------------------------------------------
// Admin Response
// ---------------------------------------------------------------

/**
 * Validates an admin response message.
 */
function validateAdminResponse({ message }) {
  return validateText(message, "Response message", 10, 5000);
}

// ---------------------------------------------------------------
// Community comments
// ---------------------------------------------------------------

/**
 * Validates a student comment posted to a published community item.
 */
function validateCommunityComment({ commentText }) {
  return validateText(commentText, "Comment", 1, 500);
}

// ---------------------------------------------------------------
// Status Change
// ---------------------------------------------------------------

/**
 * Validates a status change value.
 */
function validateStatusChange({ status }) {
  return validateEnum(status, "Status", VALID_STATUSES);
}

// ---------------------------------------------------------------
// Exports
// ---------------------------------------------------------------

module.exports = {
  sanitize,
  validateText,
  validateEnum,
  validateEmail,
  validatePassword,
  validateRegistration,
  validateLogin,
  validateFeedbackSubmission,
  validateAdminResponse,
  validateCommunityComment,
  validateStatusChange,
  VALID_FEEDBACK_TYPES,
  VALID_PRIORITIES,
  VALID_STATUSES,
};
