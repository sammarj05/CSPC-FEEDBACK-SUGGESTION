const { describe, it, expect } = require("vitest");
const request = require("supertest");
const app = require("../app");

describe("GET /feedback — authentication required", () => {
  it("redirects unauthenticated user to login", async () => {
    const res = await request(app).get("/feedback");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/);
  });
});

describe("GET /feedback/new — authentication required", () => {
  it("redirects unauthenticated user to login", async () => {
    const res = await request(app).get("/feedback/new");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/);
  });
});

describe("GET /feedback/:id — authentication required", () => {
  it("redirects unauthenticated user for any numeric ID", async () => {
    const res = await request(app).get("/feedback/1");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/);
  });
});

describe("POST /feedback — unauthenticated submission rejected", () => {
  it("rejects valid-looking feedback without a session", async () => {
    const res = await request(app)
      .post("/feedback")
      .type("form")
      .send({
        type:        "suggestion",
        categoryId:  "1",
        priority:    "medium",
        subject:     "Library should extend hours on weekdays",
        description: "The current library schedule is not enough for students who study late.",
      });
    expect([302, 401, 403]).toContain(res.status);
  });
});

describe("Admin routes — unauthenticated access rejected", () => {
  it("GET /admin/feedback redirects or 403s without login", async () => {
    const res = await request(app).get("/admin/feedback");
    expect([302, 403]).toContain(res.status);
  });

  it("GET /admin/feedback/1 redirects or 403s without login", async () => {
    const res = await request(app).get("/admin/feedback/1");
    expect([302, 403]).toContain(res.status);
  });

  it("POST /admin/feedback/1/respond rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/admin/feedback/1/respond")
      .type("form")
      .send({ message: "This is an administrative response message." });
    expect([302, 403]).toContain(res.status);
  });

  it("POST /admin/feedback/1/status rejects unauthenticated status change", async () => {
    const res = await request(app)
      .post("/admin/feedback/1/status")
      .type("form")
      .send({ status: "resolved", note: "Fixed." });
    expect([302, 403]).toContain(res.status);
  });
});

describe("Home page", () => {
  it("shows Get Started and Log In when not authenticated", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Get Started");
    expect(res.text).toContain("Log In");
  });

  it("displays Academic category chip on the home page", async () => {
    const res = await request(app).get("/");
    expect(res.text).toContain("Academic");
    expect(res.text).toContain("Facilities");
  });

  it("contains How It Works section", async () => {
    const res = await request(app).get("/");
    expect(res.text).toContain("How It Works");
  });
});
