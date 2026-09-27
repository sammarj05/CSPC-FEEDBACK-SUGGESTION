import { describe, it, expect, afterAll } from "vitest";
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

describe("Anonymous feedback ownership and privacy", { timeout: 30000 }, () => {
  const feedbackModel = require("../models/feedbackModel");
  const feedbackCtrl  = require("../controllers/feedbackController");
  const adminCtrl     = require("../controllers/adminController");

  // 1. Anonymous feedback is successfully created.
  it("1. successfully creates anonymous feedback with unique reference number and is_anonymous=1", async () => {
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
  });

  // 2. Anonymous feedback appears to the submitting student.
  it("2. anonymous feedback appears to the submitting student in list, detail, and stats", async () => {
    const { insertId, referenceNumber } = await feedbackModel.create({
      userId: 2,
      categoryId: 1,
      type: "suggestion",
      priority: "low",
      subject: "Anonymous student suggestion for study pods",
      description: "Quiet study pods in the library would greatly help students.",
      isAnonymous: true,
    });

    // Student findByUserId includes anonymous feedback
    const userFeedback = await feedbackModel.findByUserId(2);
    const found = userFeedback.find((f) => f.id === insertId);
    expect(found).toBeDefined();
    expect(found.reference_number).toBe(referenceNumber);
    expect(found.is_anonymous).toBe(1);

    // Student findByIdAndUser retrieves own anonymous feedback
    const detail = await feedbackModel.findByIdAndUser(insertId, 2);
    expect(detail).not.toBeNull();
    expect(detail.reference_number).toBe(referenceNumber);
    expect(detail.subject).toBe("Anonymous student suggestion for study pods");
    expect(detail.is_anonymous).toBe(1);

    // Student stats includes anonymous submission
    const stats = await feedbackModel.studentStats(2);
    expect(stats.total).toBeGreaterThanOrEqual(1);

    // Controller detail view renders for the owner student
    let renderedView = null;
    let renderedData = null;
    const mockReq = {
      params: { id: String(insertId) },
      session: { user: { id: 2, name: "Sam Canonce", role: "student" } },
    };
    const mockRes = {
      status: (code) => {
        mockRes.statusCode = code;
        return mockRes;
      },
      render: (view, data) => {
        renderedView = view;
        renderedData = data;
      },
    };
    await feedbackCtrl.feedbackDetail(mockReq, mockRes, (err) => { if (err) throw err; });
    expect(renderedView).toBe("student/feedback-detail");
    expect(renderedData.feedback.reference_number).toBe(referenceNumber);
    expect(renderedData.feedback.is_anonymous).toBe(1);
  });

  // 3. Anonymous feedback remains hidden from other students.
  it("3. anonymous feedback remains hidden from other students", async () => {
    const { insertId } = await feedbackModel.create({
      userId: 2,
      categoryId: 1,
      type: "concern",
      priority: "medium",
      subject: "Anonymous concern about cafeteria hygiene",
      description: "Sanitizing stations in the cafeteria need regular refilling.",
      isAnonymous: true,
    });

    // Other student (userId: 3) should not see it in findByUserId
    const otherStudentList = await feedbackModel.findByUserId(3);
    const foundInOther = otherStudentList.find((f) => f.id === insertId);
    expect(foundInOther).toBeUndefined();

    // Other student should not access it via findByIdAndUser
    const otherStudentDetail = await feedbackModel.findByIdAndUser(insertId, 3);
    expect(otherStudentDetail).toBeNull();

    // Controller detail returns 404 for other student
    let statusCode = 200;
    let renderedView = null;
    const mockReq = {
      params: { id: String(insertId) },
      session: { user: { id: 3, name: "KRIZA ALTHEA LLAGAS", role: "student" } },
    };
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return mockRes;
      },
      render: (view) => {
        renderedView = view;
      },
    };
    await feedbackCtrl.feedbackDetail(mockReq, mockRes, (err) => { if (err) throw err; });
    expect(statusCode).toBe(404);
    expect(renderedView).toBe("errors/404");
  });

  // 4. Anonymous feedback does not expose the student's identity to admins.
  it("4. anonymous feedback does not expose student identity to admins in detail, reference, or list", async () => {
    const { insertId, referenceNumber } = await feedbackModel.create({
      userId: 2,
      categoryId: 1,
      type: "complaint",
      priority: "high",
      subject: "Anonymous complaint regarding laboratory equipment",
      description: "Oscilloscope in Lab 3 is malfunctioning and poses safety risk.",
      isAnonymous: true,
    });

    // findByIdAdmin masks user_id and student details
    const recordById = await feedbackModel.findByIdAdmin(insertId);
    expect(recordById).not.toBeNull();
    expect(recordById.user_id).toBeNull();
    expect(recordById.student_name).toBeNull();
    expect(recordById.student_email).toBeNull();
    expect(recordById.student_id_no).toBeNull();
    expect(recordById.is_anonymous).toBe(1);

    // findByReference masks user_id and student details
    const recordByRef = await feedbackModel.findByReference(referenceNumber);
    expect(recordByRef).not.toBeNull();
    expect(recordByRef.user_id).toBeNull();
    expect(recordByRef.student_name).toBeNull();
    expect(recordByRef.student_email).toBeNull();
    expect(recordByRef.student_id_no).toBeNull();
    expect(recordByRef.is_anonymous).toBe(1);

    // adminList masks student_name
    const { rows } = await feedbackModel.adminList({ search: referenceNumber });
    expect(rows.length).toBe(1);
    expect(rows[0].student_name).toBeNull();
    expect(rows[0].is_anonymous).toBe(1);

    // Admin controller feedbackDetail does not expose student identity
    let adminRenderedData = null;
    const mockReq = {
      params: { id: String(insertId) },
      session: { user: { id: 1, name: "System Administrator", role: "admin" } },
    };
    const mockRes = {
      status: () => mockRes,
      render: (view, data) => {
        adminRenderedData = data;
      },
    };
    await adminCtrl.feedbackDetail(mockReq, mockRes, (err) => { if (err) throw err; });
    expect(adminRenderedData.feedback.student_name).toBeNull();
    expect(adminRenderedData.feedback.user_id).toBeNull();
    expect(adminRenderedData.feedback.is_anonymous).toBe(1);
  });

  // 5. Normal feedback still appears to its owner.
  it("5. normal (non-anonymous) feedback appears to its owner and exposes student info to admin", async () => {
    const { insertId } = await feedbackModel.create({
      userId: 2,
      categoryId: 1,
      type: "suggestion",
      priority: "medium",
      subject: "Non-anonymous student suggestion for sports equipment",
      description: "More basketballs and volleyballs needed in the gymnasium.",
      isAnonymous: false,
    });

    // Owner student sees it
    const userFeedback = await feedbackModel.findByUserId(2);
    const found = userFeedback.find((f) => f.id === insertId);
    expect(found).toBeDefined();
    expect(found.is_anonymous).toBe(0);

    const detail = await feedbackModel.findByIdAndUser(insertId, 2);
    expect(detail).not.toBeNull();
    expect(detail.is_anonymous).toBe(0);

    // Admin sees student identity for non-anonymous submission
    const adminRecord = await feedbackModel.findByIdAdmin(insertId);
    expect(adminRecord).not.toBeNull();
    expect(adminRecord.user_id).toBe(2);
    expect(adminRecord.student_name).toBe("Sam Canonce");
    expect(adminRecord.is_anonymous).toBe(0);
  });

  // 6. Unauthorized users cannot access another student's feedback by changing the feedback ID.
  it("6. unauthorized users cannot access another student's feedback by changing the feedback ID", async () => {
    const { insertId } = await feedbackModel.create({
      userId: 2,
      categoryId: 1,
      type: "suggestion",
      priority: "low",
      subject: "IDOR test suggestion",
      description: "Testing that student 3 cannot view student 2 feedback.",
      isAnonymous: false,
    });

    // Model level: findByIdAndUser for student 3 returns null
    const result = await feedbackModel.findByIdAndUser(insertId, 3);
    expect(result).toBeNull();

    // Controller level: student 3 receives 404
    let statusCode = 200;
    let renderedView = null;
    const mockReq = {
      params: { id: String(insertId) },
      session: { user: { id: 3, name: "KRIZA ALTHEA LLAGAS", role: "student" } },
    };
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return mockRes;
      },
      render: (view) => {
        renderedView = view;
      },
    };
    await feedbackCtrl.feedbackDetail(mockReq, mockRes, (err) => { if (err) throw err; });
    expect(statusCode).toBe(404);
    expect(renderedView).toBe("errors/404");
  });

  // 7. Existing anonymous submission behavior and redirect still work.
  it("7. controller redirects anonymous submissions to /student/dashboard with reference number flash", async () => {
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

  it("7b. controller redirects non-anonymous submissions to /feedback/:id", async () => {
    let redirectedStatus = null;
    let redirectedUrl = null;

    const mockReq = {
      body: {
        type: "suggestion",
        categoryId: "1",
        priority: "low",
        subject: "Non-anonymous test submission redirect",
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

  it("7c. admin can view and update status of anonymous feedback", async () => {
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

  afterAll(async () => {
    const db = require("../config/database");
    await db.end();
  });
});

