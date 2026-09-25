"use strict";

/**
 * controllers/authController.js
 *
 * Handles registration, login, and logout.
 *
 * Security notes:
 *   - Passwords hashed with bcrypt (cost factor 12)
 *   - Session regenerated after successful login
 *   - Login error message is generic (no email enumeration)
 *   - Session destroyed on logout
 *   - Logout via POST to prevent CSRF on state-changing GET
 *
 * Requirements traced:
 *   FR-01  — Student registration
 *   NFR-01 — bcrypt password hashing
 *   NFR-02 — Session regenerated after login
 */

const bcrypt = require("bcrypt");
const { validateRegistration, validateLogin, sanitize } = require("../lib/validation");
const userModel = require("../models/userModel");
const logger = require("../lib/logger");

const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------
// GET /auth/register
// ---------------------------------------------------------------
function showRegister(req, res) {
  res.render("auth/register", {
    title: "Create Account — CSPC Feedback System",
    errors: [],
    formData: {},
  });
}

// ---------------------------------------------------------------
// POST /auth/register
// ---------------------------------------------------------------
async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword, studentId, department } = req.body;

    // Server-side validation — never trust req.body
    const { valid, errors } = validateRegistration({
      name,
      email,
      password,
      confirmPassword,
      studentId,
      department,
    });

    if (!valid) {
      return res.status(422).render("auth/register", {
        title: "Create Account — CSPC Feedback System",
        errors,
        formData: { name, email, studentId, department },
      });
    }

    // Check for duplicate email (normalized to lowercase)
    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(422).render("auth/register", {
        title: "Create Account — CSPC Feedback System",
        errors: ["An account with that email address already exists."],
        formData: { name, email, studentId, department },
      });
    }

    // Hash password — never store plaintext
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const insertId = await userModel.createStudent({
      name: sanitize(name),
      email: sanitize(email),
      passwordHash,
      studentId: studentId ? sanitize(studentId) : null,
      department: department ? sanitize(department) : null,
    });

    logger.info("Student registered", { userId: insertId });

    req.flash("success", "Account created successfully. Please log in.");
    return res.redirect(303, "/auth/login");
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// GET /auth/login
// ---------------------------------------------------------------
function showLogin(req, res) {
  res.render("auth/login", {
    title: "Log In — CSPC Feedback System",
    errors: [],
    formData: {},
  });
}

// ---------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const { valid, errors: fieldErrors } = validateLogin({ email, password });
    if (!valid) {
      return res.status(422).render("auth/login", {
        title: "Log In — CSPC Feedback System",
        errors: fieldErrors,
        formData: { email },
      });
    }

    const user = await userModel.findByEmail(email);

    // Generic error — do not reveal whether the email exists
    const GENERIC_AUTH_ERROR = "Invalid email address or password.";

    if (!user || !user.is_active) {
      logger.warn("Login failed — user not found or inactive", { email: sanitize(email) });
      return res.status(401).render("auth/login", {
        title: "Log In — CSPC Feedback System",
        errors: [GENERIC_AUTH_ERROR],
        formData: { email },
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      logger.warn("Login failed — incorrect password", { userId: user.id });
      return res.status(401).render("auth/login", {
        title: "Log In — CSPC Feedback System",
        errors: [GENERIC_AUTH_ERROR],
        formData: { email },
      });
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) return next(err);

      // Store only necessary, non-sensitive data in session
      req.session.user = {
        id:   user.id,
        name: user.name,
        role: user.role,
      };

      logger.info("Login successful", { userId: user.id, role: user.role });

      // Route by role
      if (user.role === "admin") {
        return res.redirect(303, "/admin/dashboard");
      }
      return res.redirect(303, "/student/dashboard");
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------
function logout(req, res, next) {
  const userId = req.session.user ? req.session.user.id : null;

  req.session.destroy((err) => {
    if (err) return next(err);
    logger.info("Logout", { userId });
    res.clearCookie("connect.sid");
    return res.redirect(303, "/");
  });
}

module.exports = { showRegister, register, showLogin, login, logout };
