"use strict";

/**
 * routes/authRoutes.js
 *
 * Authentication routes:
 *  - Google OAuth: /auth/google, /auth/google/callback
 *  - Manual email/password: register, login, logout (kept as fallback)
 *
 * Google OAuth: any Google account can sign in. No domain restriction.
 */

const express  = require("express");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const authCtrl = require("../controllers/authController");
const { redirectIfLoggedIn } = require("../middleware/authMiddleware");
const logger   = require("../lib/logger");

const router = express.Router();

// Rate limiter for manual auth endpoints
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         "Too many attempts. Please try again in 15 minutes.",
});

// ---------------------------------------------------------------
// Manual email/password routes (fallback / admin use)
// ---------------------------------------------------------------
router.get("/register", redirectIfLoggedIn, authCtrl.showRegister);
router.post("/register", redirectIfLoggedIn, authLimiter, authCtrl.register);
router.get("/login", redirectIfLoggedIn, authCtrl.showLogin);
router.post("/login", redirectIfLoggedIn, authLimiter, authCtrl.login);
router.post("/logout", authCtrl.logout);

// ---------------------------------------------------------------
// Google OAuth — "Sign in with Google"
// ---------------------------------------------------------------

// Guard: show a clear message if credentials are not configured
function requireOAuth(req, res, next) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    req.flash("error", "Google sign-in is not yet configured on this server. Please use email and password.");
    return res.redirect("/auth/login");
  }
  next();
}

/**
 * GET /auth/google
 * Starts the Google OAuth flow.
 * Any Google account is accepted — no domain filter.
 */
router.get(
  "/google",
  redirectIfLoggedIn,
  requireOAuth,
  passport.authenticate("google", {
    scope:  ["profile", "email"],
    prompt: "select_account",
  })
);

/**
 * GET /auth/google/callback
 * Google redirects here after the user approves.
 * Success → dashboard. Failure → login with flash error.
 */
router.get(
  "/google/callback",
  requireOAuth,
  passport.authenticate("google", {
    failureRedirect: "/auth/login",
    failureFlash:    true,
    session:         true,
  }),
  (req, res) => {
    // Set session user (same shape as manual login)
    if (req.user) {
      req.session.user = {
        id:   req.user.id,
        name: req.user.name,
        role: req.user.role,
      };
      logger.info("Google OAuth login success", { userId: req.user.id, role: req.user.role });
    }

    // Route by role
    if (req.user && req.user.role === "admin") {
      return res.redirect(303, "/admin/dashboard");
    }
    return res.redirect(303, "/student/dashboard");
  }
);

module.exports = router;
