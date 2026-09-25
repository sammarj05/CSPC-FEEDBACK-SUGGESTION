"use strict";

/**
 * lib/logger.js
 *
 * Application event logger.
 * Wraps console.log/error with timestamped, structured output.
 *
 * NEVER log: passwords, password hashes, SESSION_SECRET, DB credentials.
 *
 * In production you would replace this with winston or pino,
 * but for this project console logging is sufficient.
 */

const isDev = process.env.NODE_ENV !== "production";

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info(event, data = {}) {
    console.log(JSON.stringify({ ts: timestamp(), level: "INFO", event, ...data }));
  },

  warn(event, data = {}) {
    console.warn(JSON.stringify({ ts: timestamp(), level: "WARN", event, ...data }));
  },

  error(event, data = {}) {
    // Never include passwords or secrets even accidentally
    const safe = { ...data };
    delete safe.password;
    delete safe.password_hash;
    delete safe.sessionSecret;
    console.error(JSON.stringify({ ts: timestamp(), level: "ERROR", event, ...safe }));
  },

  /**
   * Log only in development mode.
   */
  debug(event, data = {}) {
    if (isDev) {
      console.log(JSON.stringify({ ts: timestamp(), level: "DEBUG", event, ...data }));
    }
  },
};

module.exports = logger;
