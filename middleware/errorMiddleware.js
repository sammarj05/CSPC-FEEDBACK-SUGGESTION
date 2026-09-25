"use strict";

/**
 * middleware/errorMiddleware.js
 *
 * 404 and centralized error handlers.
 *
 * These MUST be registered LAST in app.js.
 *
 * The error handler never exposes:
 *   - Stack traces to non-development environments
 *   - SQL statements
 *   - Database credentials
 *   - Internal implementation details
 */

const logger = require("../lib/logger");

/**
 * 404 handler — catches any request that reached no route.
 */
function notFound(req, res, _next) {
  res.status(404).render("errors/404", {
    title: "Page Not Found",
    user: req.session.user || null,
  });
}

/**
 * Centralized error handler.
 * Express identifies this as an error handler because it takes 4 arguments.
 */
function errorHandler(err, req, res, _next) {
  logger.error("Unhandled error", {
    message: err.message,
    path: req.path,
    method: req.method,
    // Only include stack in development
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).render("errors/500", {
    title: "Something Went Wrong",
    // Never expose internal error details in production
    detail: process.env.NODE_ENV !== "production" ? err.message : null,
    user: req.session.user || null,
  });
}

module.exports = { notFound, errorHandler };
