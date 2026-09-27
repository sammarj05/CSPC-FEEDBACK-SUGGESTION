import { describe, it, expect } from "vitest";
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

describe("Anonymous feedback submission flow & model checks", { timeout: 30000 }, () => {
  const feedbackModel = require("../models/feedbackModel");
  const feedbackCtrl = require("../controllers/feedbackController");

  it("saves anonymous feedback in database with user_id=null and is_anonymous=1", async () => {
    const { insertId, referenceNumber } = await feedbackModel.create({
      userId: 2,
      categoryId: 1,
      type: "complaint",
      priority: "medium",
      subject: "Anonymous test submission for air conditioning",
      description: "Room 302 AC unit is emitting loud noises during class lectures.",
      isAnonymous: true,
    });

    expect(insertId).toBeGreaterThan(0);
    expect(referenceNumber).toMatch(/^FB-\d{4}-\d{5}$/);

    // Verify row directly in database via findByIdAdmin
    const record = await feedbackModel.findByIdAdmin(insertId);
    expect(record).not.toBeNull();
    expect(record.user_id).toBeNull();
    expect(record.is_anonymous).toBe(1);
    expect(record.student_name).toBeNull();
    expect(record.student_email).toBeNull();
    expect(record.student_id_no).toBeNull();
    expect(record.reference_number).toBe(referenceNumber);
    expect(record.status).toBe("submitted");
  }, 30000);

  it("controller redirects anonymous submissions to /student/dashboard with reference number flash", async () => {
    let redirectedStatus = null;
    let redirectedUrl = null;
    let flashType = null;
    let flashMsg = null;

    const mockReq = {
      body: {
        type: "suggestion",
        categoryId: "1",
        priority: "low",
        subject: "Add more bicycle racks near gate 2",
        description: "Many students bike to school but rack space is often full.",
        isAnonymous: "1",
      },
      session: {
        user: { id: 2, name: "Sam Canonce", role: "student" },
      },
      flash: (type, msg) => {
        flashType = type;
        flashMsg = msg;
      },
    };

    const mockRes = {
      redirect: (status, url) => {
        redirectedStatus = status;
        redirectedUrl = url;
      },
      status: () => mockRes,
      render: () => {},
    };

    await feedbackCtrl.submitFeedback(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    expect(redirectedStatus).toBe(303);
    expect(redirectedUrl).toBe("/student/dashboard");
    expect(flashType).toBe("success");
    expect(flashMsg).toMatch(/FB-\d{4}-\d{5}/);
  });

  it("controller redirects non-anonymous submissions to /feedback/:id", async () => {
    let redirectedStatus = null;
    let redirectedUrl = null;

    const mockReq = {
      body: {
        type: "suggestion",
        categoryId: "1",
        priority: "low",
        subject: "Non-anonymous test submission",
        description: "Checking that regular non-anonymous feedback routes to detail page.",
        isAnonymous: undefined,
      },
      session: {
        user: { id: 2, name: "Sam Canonce", role: "student" },
      },
      flash: () => {},
    };

    const mockRes = {
      redirect: (status, url) => {
        redirectedStatus = status;
        redirectedUrl = url;
      },
      status: () => mockRes,
      render: () => {},
    };

    await feedbackCtrl.submitFeedback(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    expect(redirectedStatus).toBe(303);
    expect(redirectedUrl).toMatch(/^\/feedback\/\d+$/);
  });

  it("admin can view and update status of anonymous feedback", async () => {
    const { insertId } = await feedbackModel.create({
      userId: 2,
      categoryId: 1,
      type: "concern",
      priority: "high",
      subject: "Water dispenser filter needs replacement",
      description: "The water filter indicator on the 2nd floor has turned red.",
      isAnonymous: true,
    });

    // Admin updates status
    const updated = await feedbackModel.updateStatus(insertId, "under_review", 1, "Reviewed by admin.");
    expect(updated).toBe(true);

    const record = await feedbackModel.findByIdAdmin(insertId);
    expect(record.status).toBe("under_review");
    expect(record.is_anonymous).toBe(1);
    expect(record.student_name).toBeNull();
  });
});

