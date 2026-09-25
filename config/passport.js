"use strict";

/**
 * config/passport.js
 *
 * Passport.js — Google OAuth 2.0 strategy.
 *
 * Behaviour:
 *  - Any Google account can sign in. No domain restriction.
 *  - First-time sign-in → student account auto-created from Google profile.
 *  - Returning user → looked up by email and logged in.
 *  - Role is always loaded from the database, never from Google.
 *  - Strategy is only registered when credentials are present in .env.
 */

const passport      = require("passport");
const userModel     = require("../models/userModel");
const logger        = require("../lib/logger");
const db            = require("./database");

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require("passport-google-oauth20").Strategy;

  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract primary email from Google profile
          const email = profile.emails && profile.emails[0]
            ? profile.emails[0].value.toLowerCase().trim()
            : null;

          if (!email) {
            logger.warn("OAuth login rejected — no email in Google profile", { googleId: profile.id });
            return done(null, false, { message: "Google did not provide an email address. Please try again." });
          }

          const name   = profile.displayName || email.split("@")[0];
          const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

          // Look up existing user by email
          let user = await userModel.findByEmail(email);

          if (!user) {
            // First-time login — auto-create student account from Google profile
            const insertId = await userModel.createStudentOAuth({
              name,
              email,
              googleId: profile.id,
              avatar,
            });
            user = await userModel.findById(insertId);
            logger.info("OAuth auto-provisioned new student", { userId: insertId, email });
          } else {
            // Returning user — update google_id / avatar if not stored yet
            if (!user.google_id) {
              await db.query(
                "UPDATE users SET google_id = ?, avatar = ? WHERE id = ?",
                [profile.id, avatar, user.id]
              );
            }
          }

          if (!user.is_active) {
            logger.warn("OAuth login rejected — account inactive", { userId: user.id });
            return done(null, false, { message: "Your account has been deactivated. Please contact the administrator." });
          }

          logger.info("OAuth login successful", { userId: user.id, email, role: user.role });
          return done(null, user);
        } catch (err) {
          logger.error("OAuth strategy error", { message: err.message });
          return done(err);
        }
      }
    )
  );

  logger.info("Google OAuth strategy registered (no domain restriction)");
} else {
  logger.warn("Google OAuth not configured — GOOGLE_CLIENT_ID/SECRET missing in .env");
}

// ---------------------------------------------------------------
// Session serialization — only store user ID in the session
// ---------------------------------------------------------------
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
