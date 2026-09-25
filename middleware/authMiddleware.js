"use strict";

/**
 * middleware/authMiddleware.js
 *
 * Authentication and authorization middleware.
 *
 * requireLogin  — ensures a valid session exists
 * requireRole   — ensures the session user has the specified role
 *
 * Authorization is enforced SERVER-SIDE.
 * Hiding links in the UI is not sufficient.
 *
 * Requirements traced:
 *   NFR-02 — Protected routes require authentication
 *   FR-05  — Admin routes protected on the server
 */

/**
 * Middleware: requires a valid logged-in session.
 * Redirects to /auth/login if no session.
 */
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash("error", "Please log in to access that page.");
  return res.redirect("/auth/login");
}

/**
 * Middleware factory: requires a specific role.
 * Must be used AFTER requireLogin.
 *
 * Usage: requireRole("admin")
 *
 * @param {string} role
 */
function requireRole(role) {
  return function (req, res, next) {
    // Role is taken from the session (server-side) — never from the browser
    if (req.session && req.session.user && req.session.user.role === role) {
      return next();
    }
    // Do not reveal why access was denied — generic 403
    return res.status(403).render("errors/403", {
      title: "Access Denied",
      message: "You do not have permission to access this page.",
      user: req.session.user || null,
    });
  };
}

/**
 * Redirect already-authenticated users away from auth pages.
 * Prevents a logged-in student from seeing the login form again.
 */
function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === "admin") return res.redirect("/admin/dashboard");
    return res.redirect("/student/dashboard");
  }
  return next();
}

module.exports = { requireLogin, requireRole, redirectIfLoggedIn };
