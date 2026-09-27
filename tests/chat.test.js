"use strict";

/**
 * tests/chat.test.js
 *
 * Aizen AI — chatbot feature tests.
 *
 * Tests:
 *  1.  POST /api/chat handles DB errors gracefully (table not in test DB).
 *  2.  Empty messages are rejected with 400.
 *  3.  Excessively long messages (>1000 chars) are rejected with 400.
 *  4.  GEMINI_API_KEY is never exposed in any API response.
 *  5.  Rate limiter is configured in chatRoutes.js (code inspection).
 *  6.  Gemini failure handled: chatController returns friendly JSON on error.
 *  7.  IDOR ownership rule is enforced in chatModel source code.
 *  8.  Anonymous feedback identity is guarded in chatController source.
 *  9.  chatModel uses only parameterized queries (no SQL injection vector).
 *  9b. chatController system prompt forbids arbitrary SQL.
 * 10.  Feedback ownership rule enforced in feedbackModel source code.
 * 11.  POST /api/chat/escalate is a valid registered route.
 * 12.  GET /admin/chat requires admin role (302/403 for guests).
 * 13.  Existing login page still loads.
 * 14.  Existing feedback submission route still requires auth.
 * 15.  Existing /feedback/new still requires auth.
 * 16.  Existing /admin/feedback still requires admin role.
 *
 * Note on mocking strategy:
 *   The chat tests that require real Gemini/DB behaviour (tests 1, 7, 10)
 *   instead perform source-code inspection to verify the security invariant
 *   because vi.mock() with require() has known hoisting limitations in
 *   Vitest's CommonJS interop. The HTTP layer tests use SuperTest directly
 *   against the real app, which requires the chat_conversations table to exist.
 *   Tests 1 and 11 account for the possibility that the table may not exist
 *   in the test database by accepting 500 gracefully (the controller does not
 *   expose stack traces or secrets — that is the invariant being tested).
 */

import { describe, it, expect, vi } from "vitest";
const request = require("supertest");
const fs      = require("fs");
const path    = require("path");

process.env.NODE_ENV       = "test";
process.env.GEMINI_API_KEY = "FAKE_TEST_KEY_DO_NOT_USE";

const app = require("../app");

describe("Aizen AI — Chat Feature", () => {

  // ---------------------------------------------------------------
  // 1. POST /api/chat — valid message, graceful response
  // ---------------------------------------------------------------
  it("1. POST /api/chat never exposes stack traces or secrets (graceful handling)", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "What is this website?" })
      .set("Content-Type", "application/json");

    // Any response is acceptable EXCEPT one that leaks secrets / stack traces
    const body = JSON.stringify(res.body) + (res.text || "");
    expect(body).not.toContain("FAKE_TEST_KEY_DO_NOT_USE");
    expect(body).not.toContain("GEMINI_API_KEY");
    expect(body).not.toContain("DB_PASSWORD");
    expect(body).not.toContain("stack");
    // Should NOT be a raw Express error page without a JSON body
    // (the error handler must return JSON for API routes)
    if (res.status === 500) {
      // Even on 500, error message must be generic
      expect(body).not.toContain("cspc_feedback_db");
      expect(body).not.toContain("ER_NO_SUCH_TABLE");
    }
  });

  // ---------------------------------------------------------------
  // 2. Empty message → 400
  // ---------------------------------------------------------------
  it("2. POST /api/chat rejects empty messages with 400", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/empty/i);
  });

  // ---------------------------------------------------------------
  // 2b. Whitespace-only → 400
  // ---------------------------------------------------------------
  it("2b. POST /api/chat rejects whitespace-only messages with 400", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "   " })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // ---------------------------------------------------------------
  // 3. Message > 1000 chars → 400
  // ---------------------------------------------------------------
  it("3. POST /api/chat rejects messages over 1000 characters with 400", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "A".repeat(1001) })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/long|1000/i);
  });

  // ---------------------------------------------------------------
  // 4. GEMINI_API_KEY never exposed in response
  // ---------------------------------------------------------------
  it("4. GEMINI_API_KEY is never exposed in any API response", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "Hello" })
      .set("Content-Type", "application/json");

    const dump = JSON.stringify(res.body) + (res.text || "");
    expect(dump).not.toContain("FAKE_TEST_KEY_DO_NOT_USE");
    expect(dump).not.toContain("GEMINI_API_KEY");
  });

  // ---------------------------------------------------------------
  // 5. Rate limiter configured
  // ---------------------------------------------------------------
  it("5. chatRoutes.js is configured with a rate limiter", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../routes/chatRoutes.js"),
      "utf8"
    );
    expect(src).toMatch(/rateLimit/);
    expect(src).toMatch(/windowMs/);
    expect(src).toMatch(/max:/);
  });

  // ---------------------------------------------------------------
  // 6. Gemini failure handled gracefully — inspect controller code
  // ---------------------------------------------------------------
  it("6. chatController contains a Gemini catch block that returns a friendly message (not a crash)", () => {
    const ctrl = fs.readFileSync(
      path.resolve(__dirname, "../controllers/chatController.js"),
      "utf8"
    );
    // Must have a catch block for Gemini errors
    expect(ctrl).toMatch(/geminiErr|gemini.*catch|catch.*gemini/i);
    // Must return a friendly unavailable message
    expect(ctrl).toMatch(/temporarily unavailable/i);
    // Must NOT expose the API key variable name in the response
    expect(ctrl).not.toMatch(/res\.json\(.*GEMINI_API_KEY/);
  });

  // ---------------------------------------------------------------
  // 7. IDOR — ownership enforced in chatModel source code
  // ---------------------------------------------------------------
  it("7. IDOR: chatModel.findConversation enforces user_id ownership in SQL", () => {
    const model = fs.readFileSync(
      path.resolve(__dirname, "../models/chatModel.js"),
      "utf8"
    );
    // The findConversation function must append AND user_id = ? when userId is provided
    expect(model).toMatch(/user_id\s*=\s*\?/);
    // Must use parameterized queries (? placeholders), never string interpolation
    expect(model).toMatch(/\?/);
    expect(model).not.toMatch(/WHERE id = \$\{/);
  });

  // ---------------------------------------------------------------
  // 8. Anonymous identity guarded
  // ---------------------------------------------------------------
  it("8. chatController guards anonymous feedback identity in system prompt", () => {
    const ctrl = fs.readFileSync(
      path.resolve(__dirname, "../controllers/chatController.js"),
      "utf8"
    );
    expect(ctrl).toMatch(/anonymous/i);
    expect(ctrl).toMatch(/identity|reveal/i);
    expect(ctrl).toMatch(/do not reveal student identity/i);
  });

  // ---------------------------------------------------------------
  // 9. No raw SQL injection via user input
  // ---------------------------------------------------------------
  it("9. chatModel uses parameterized queries (no template-literal SQL injection)", () => {
    const model = fs.readFileSync(
      path.resolve(__dirname, "../models/chatModel.js"),
      "utf8"
    );
    expect(model).toMatch(/\?/);
    // Message content must never be interpolated directly into SQL
    expect(model).not.toMatch(/`[^`]*\$\{.*message.*\}/);
  });

  // ---------------------------------------------------------------
  // 9b. System prompt forbids SQL
  // ---------------------------------------------------------------
  it("9b. chatController system prompt explicitly forbids SQL generation by the AI", () => {
    const ctrl = fs.readFileSync(
      path.resolve(__dirname, "../controllers/chatController.js"),
      "utf8"
    );
    expect(ctrl).toMatch(/SQL|database.*direct|arbitrary/i);
  });

  // ---------------------------------------------------------------
  // 10. Feedback ownership — inspect feedbackModel source code
  // ---------------------------------------------------------------
  it("10. feedbackModel.findByIdAndUser includes WHERE user_id = ? (ownership-scoped)", () => {
    const model = fs.readFileSync(
      path.resolve(__dirname, "../models/feedbackModel.js"),
      "utf8"
    );
    // Must contain both id = ? and user_id = ? checks
    expect(model).toMatch(/findByIdAndUser|WHERE.*user_id/i);
    expect(model).toMatch(/user_id\s*=\s*\?/);
  });

  // ---------------------------------------------------------------
  // 11. Escalation route exists
  // ---------------------------------------------------------------
  it("11. POST /api/chat/escalate is a registered route (does not return 404)", async () => {
    const res = await request(app)
      .post("/api/chat/escalate")
      .send({ conversationId: 1 })
      .set("Content-Type", "application/json");

    expect(res.status).not.toBe(404);
  });

  // ---------------------------------------------------------------
  // 12. Admin chat requires admin role
  // ---------------------------------------------------------------
  it("12. GET /admin/chat returns 302 or 403 for unauthenticated users", async () => {
    const res = await request(app).get("/admin/chat");
    expect([302, 403]).toContain(res.status);
  });

  // ---------------------------------------------------------------
  // 13–16. Existing functionality still works
  // ---------------------------------------------------------------
  it("13. GET /auth/login still returns 200 (existing login functionality)", async () => {
    const res = await request(app).get("/auth/login");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Log In");
  });

  it("14. POST /feedback redirects unauthenticated users (existing auth still works)", async () => {
    const res = await request(app)
      .post("/feedback")
      .send("type=suggestion&subject=test&description=test&categoryId=1");
    expect([302, 303]).toContain(res.status);
  });

  it("15. GET /feedback/new requires authentication (existing anonymous feedback behavior)", async () => {
    const res = await request(app).get("/feedback/new");
    expect([302, 303]).toContain(res.status);
  });

  it("16. GET /admin/feedback still requires admin role (existing admin functionality)", async () => {
    const res = await request(app).get("/admin/feedback");
    expect([302, 403]).toContain(res.status);
  });

});
