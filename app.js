"use strict";

/**
 * app.js
 *
 * Configures the Express application:
 *   1. Middleware (logger, body parser, session, security, flash)
 *   2. View engine
 *   3. Static files
 *   4. Routes
 *   5. 404 handler
 *   6. Error handler (MUST be last)
 *
 * IMPORTANT: app.listen() is NOT called here.
 * It lives in server.js so Vitest/SuperTest can import
 * the app without binding to a real port.
 *
 * Request flow:
 *   Request → Morgan logger → Body parser → Session →
 *   Helmet → Flash → CSRF → Routes → 404 → Error handler
 */

require("dotenv").config();

const express       = require("express");
const path          = require("path");
const session       = require("express-session");
const morgan        = require("morgan");
const helmet        = require("helmet");
const flash         = require("connect-flash");

const passport       = require("./config/passport");
const authRoutes     = require("./routes/authRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const adminRoutes    = require("./routes/adminRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ---------------------------------------------------------------
// Trust the first proxy (Render, Heroku, Railway, etc.)
// Required so that secure session cookies work correctly when the
// platform terminates HTTPS at a reverse proxy and forwards HTTP
// to the app. Without this, req.secure is always false in
// production and `secure: true` cookies are never sent.
// ---------------------------------------------------------------
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ---------------------------------------------------------------
// View engine
// ---------------------------------------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------------------------------------------------------------
// 1. HTTP request logger
// ---------------------------------------------------------------
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ---------------------------------------------------------------
// 2. Body parsers
// ---------------------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------------------------------------------------------
// 3. Static files
// ---------------------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------
// 4. Session
// ---------------------------------------------------------------
app.use(
  session({
    secret:            process.env.SESSION_SECRET || "dev-fallback-secret-change-in-production",
    resave:            false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
      maxAge:   2 * 60 * 60 * 1000, // 2 hours
    },
  })
);

// ---------------------------------------------------------------
// 5. Security headers (Helmet)
// ---------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        fontSrc:     ["'self'", "https://fonts.gstatic.com"],
        imgSrc:      ["'self'", "data:"],
        connectSrc:  ["'self'"],
        frameSrc:    ["'none'"],
        objectSrc:   ["'none'"],
      },
    },
  })
);

// ---------------------------------------------------------------
// 6. Passport (requires session to be registered first)
// ---------------------------------------------------------------
app.use(passport.initialize());
app.use(passport.session());

// ---------------------------------------------------------------
// 7. Flash messages (requires session)
// ---------------------------------------------------------------
app.use(flash());

// ---------------------------------------------------------------
// 8. Make flash and session user available in all EJS views
// ---------------------------------------------------------------
app.use((req, res, next) => {
  res.locals.flashSuccess = req.flash("success");
  res.locals.flashError   = req.flash("error");
  res.locals.currentUser  = req.session.user || null;
  next();
});

// ---------------------------------------------------------------
// 9. Routes
// ---------------------------------------------------------------

// Home page
app.get("/", (req, res) => {
  res.render("home", {
    title: "CSPC Suggestion & Feedback System",
    user: req.session.user || null,
  });
});

app.use("/auth",   authRoutes);
app.use("/",       feedbackRoutes);   // /student/dashboard, /feedback/*
app.use("/admin",  adminRoutes);

// ---------------------------------------------------------------
// 10. 404 handler — MUST be after all routes
// ---------------------------------------------------------------
app.use(notFound);

// ---------------------------------------------------------------
// 11. Error handler — MUST be last
// ---------------------------------------------------------------
app.use(errorHandler);

module.exports = app;
