const { describe, it, expect } = require("vitest");
const request = require("supertest");
const app = require("../app");

describe("GET /auth/login", () => {
  it("returns 200 and contains login form", async () => {
    const res = await request(app).get("/auth/login");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Log In");
  });

  it("contains CSPC branding", async () => {
    const res = await request(app).get("/auth/login");
    expect(res.text).toContain("CSPC");
  });

  it("contains Google OAuth button link", async () => {
    const res = await request(app).get("/auth/login");
    expect(res.text).toContain("/auth/google");
  });

  it("contains CSPC Email login label", async () => {
    const res = await request(app).get("/auth/login");
    expect(res.text).toContain("Login with CSPC Email");
  });
});

describe("GET /auth/register", () => {
  it("returns 200 and contains registration form", async () => {
    const res = await request(app).get("/auth/register");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Create Your Account");
  });

  it("contains CSPC Email OAuth button", async () => {
    const res = await request(app).get("/auth/register");
    expect(res.text).toContain("Continue with CSPC Email");
  });
});

describe("POST /auth/login — invalid input", () => {
  it("returns non-200 when email is missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .type("form")
      .send({ email: "", password: "somepassword" });
    expect([401, 422]).toContain(res.status);
  });

  it("returns non-200 when password is missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .type("form")
      .send({ email: "test@cspc.edu.ph", password: "" });
    expect([401, 422]).toContain(res.status);
  });

  it("returns non-200 for completely empty POST body", async () => {
    const res = await request(app)
      .post("/auth/login")
      .type("form")
      .send({});
    expect(res.status).not.toBe(200);
  });
});

describe("POST /auth/register — invalid input", () => {
  it("returns 422 for weak password", async () => {
    const res = await request(app)
      .post("/auth/register")
      .type("form")
      .send({ name: "Test", email: "t@x.com", password: "weak", confirmPassword: "weak" });
    expect(res.status).toBe(422);
  });

  it("returns 422 for mismatched passwords", async () => {
    const res = await request(app)
      .post("/auth/register")
      .type("form")
      .send({ name: "Test", email: "t@x.com", password: "Secure123", confirmPassword: "Different123" });
    expect(res.status).toBe(422);
  });

  it("returns 422 for missing name", async () => {
    const res = await request(app)
      .post("/auth/register")
      .type("form")
      .send({ name: "", email: "t@x.com", password: "Secure123", confirmPassword: "Secure123" });
    expect(res.status).toBe(422);
  });

  it("returns 422 for invalid email format", async () => {
    const res = await request(app)
      .post("/auth/register")
      .type("form")
      .send({ name: "Test", email: "not-an-email", password: "Secure123", confirmPassword: "Secure123" });
    expect(res.status).toBe(422);
  });
});

describe("Protected routes — unauthenticated access", () => {
  it("GET /student/dashboard redirects to login", async () => {
    const res = await request(app).get("/student/dashboard");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/);
  });

  it("GET /admin/dashboard redirects or rejects when not authenticated", async () => {
    const res = await request(app).get("/admin/dashboard");
    expect([302, 403]).toContain(res.status);
  });

  it("GET /feedback/new redirects to login", async () => {
    const res = await request(app).get("/feedback/new");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/);
  });

  it("GET /feedback redirects to login", async () => {
    const res = await request(app).get("/feedback");
    expect(res.status).toBe(302);
  });

  it("POST /feedback rejects unauthenticated submission", async () => {
    const res = await request(app)
      .post("/feedback")
      .type("form")
      .send({ type: "suggestion", categoryId: "1", priority: "medium", subject: "Test subject here", description: "Long enough description for testing." });
    expect([302, 401, 403]).toContain(res.status);
  });

  it("POST /admin/feedback/1/status rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/admin/feedback/1/status")
      .type("form")
      .send({ status: "resolved" });
    expect([302, 403]).toContain(res.status);
  });
});

describe("Error pages", () => {
  it("returns 404 for unknown route", async () => {
    const res = await request(app).get("/this-route-does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("GET /", () => {
  it("returns 200 and shows CSPC branding", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("CSPC");
  });
});
