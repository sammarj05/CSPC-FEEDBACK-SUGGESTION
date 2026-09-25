"use strict";

/**
 * models/categoryModel.js
 *
 * Data-access layer for the `categories` table.
 * Categories are database-driven — never hardcoded in application logic.
 *
 * Requirements traced:
 *   FR-02 — Categories come from the database
 */

const db = require("../config/database");

/**
 * Return all active categories ordered by sort_order.
 *
 * @returns {Promise<Array>}
 */
async function getAllActive() {
  const [rows] = await db.query(
    "SELECT id, name, description FROM categories WHERE is_active = 1 ORDER BY sort_order ASC"
  );
  return rows;
}

/**
 * Return a single category by primary key.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const [rows] = await db.query(
    "SELECT id, name, description FROM categories WHERE id = ? AND is_active = 1 LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

module.exports = { getAllActive, findById };
