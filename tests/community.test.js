import { describe, it, expect } from "vitest";
const request = require("supertest");
const app = require("../app");

describe("Community Feed routes — authentication required", () => {
  it("redirects an unauthenticated visitor from the feed", async () => {
    const response = await request(app).get("/community");
    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(/login/);
  });

  it("redirects an unauthenticated visitor from a discussion", async () => {
    const response = await request(app).get("/community/feedback/1");
    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(/login/);
  });

  it("rejects an unauthenticated reaction", async () => {
    const response = await request(app)
      .post("/community/feedback/1/reaction")
      .type("form")
      .send({ reactionType: "support" });
    expect([302, 401, 403]).toContain(response.status);
  });

  it("rejects an unauthenticated comment", async () => {
    const response = await request(app)
      .post("/community/feedback/1/comments")
      .type("form")
      .send({ commentText: "This should require a student session." });
    expect([302, 401, 403]).toContain(response.status);
  });
});

describe("Community moderation route — authentication required", () => {
  it("redirects an unauthenticated visitor", async () => {
    const response = await request(app).get("/admin/community/comments");
    expect([302, 403]).toContain(response.status);
  });
});
