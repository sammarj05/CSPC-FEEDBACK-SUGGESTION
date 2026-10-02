# Software Requirements Specification (SRS) & Compliance Rubric

> **Project:** CSPC Suggestion & Feedback System  
> **Institution:** Camarines Sur Polytechnic Colleges (CSPC)  
> **Course:** CCIT 106 — Application Development and Emerging Technologies  
> **Evaluation Phase:** Midterm Round 1  
> **Version:** 1.0.0  
> **Date:** October 2026  
> **Status:** Approved / Audit-Verified

---

## Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [Stakeholders & User Personas](#2-stakeholders--user-personas)
3. [System Architecture & Technology Stack](#3-system-architecture--technology-stack)
4. [Functional Requirements (FR)](#4-functional-requirements-fr)
5. [Non-Functional Requirements (NFR)](#5-non-functional-requirements-nfr)
6. [Midterm Round 1 Grading Rubric Compliance Matrix](#6-midterm-round-1-grading-rubric-compliance-matrix)
7. [Requirements Traceability Matrix (RTM)](#7-requirements-traceability-matrix-rtm)
8. [Failure-Case & Boundary Behavior Specifications](#8-failure-case--boundary-behavior-specifications)
9. [Round 2 Future Roadmap](#9-round-2-future-roadmap)

---

## 1. Executive Summary & Purpose

The **CSPC Suggestion & Feedback System** is a responsive, database-driven full-stack web application developed for Camarines Sur Polytechnic Colleges (CSPC). The primary objective is to replace archaic, untracked physical suggestion boxes with a transparent, secure, and structured digital pipeline.

### Core Objectives:
- **Democratize Student Feedback:** Allow every enrolled CSPC student to voice concerns, report facilities breakdown, submit academic suggestions, or extend appreciation.
- **Eliminate the "Black Hole" Effect:** Provide real-time status tracking via unique reference numbers (`FB-YYYY-#####`) and chronological status history.
- **Protect Student Privacy:** Enable genuine anonymous reporting that strips student identity from administrative view while allowing the student to retain personal tracking capabilities.
- **Empower Administrative Governance:** Provide CSPC personnel with an analytics dashboard, categorization, prioritization, response management, and AI triage capabilities.

---

## 2. Stakeholders & User Personas

| Role | Target Persona | Key Objectives & Permissions |
|---|---|---|
| **Student** | Enrolled CSPC undergraduate or graduate student | • Register and authenticate via credentials or CSPC Google account.<br>• Submit structured feedback with optional image attachments.<br>• View and track the live status and timeline of personal submissions.<br>• Receive official administrative responses.<br>• Interact with the Aizen AI helper for system queries. |
| **Administrator** | Authorized CSPC department head, faculty, or staff | • Access administrative dashboard with real-time feedback analytics.<br>• Search, filter, sort, and paginate feedback records across the institution.<br>• Change feedback status (`submitted` &rarr; `under_review` &rarr; `in_progress` &rarr; `resolved` &rarr; `closed`).<br>• Post formal administrative responses visible on student detail views.<br>• Review escalated AI conversations and provide human intervention. |
| **Public Visitor** | Prospective student, parent, or campus guest | • View landing page, system overview, categories, and public privacy policy.<br>• Inquire about system workflows via the Aizen AI assistant. |

---

## 3. System Architecture & Technology Stack

The application strictly implements the **Model-View-Controller (MVC)** architectural pattern:

- **Runtime & Web Framework:** Node.js (LTS v18+) & Express.js (v5.2.1)
- **View Engine:** Embedded JavaScript (EJS) with responsive semantic HTML5 and vanilla CSS
- **Database Layer:** MySQL 8.x hosted remotely on Filess.io, accessed via `mysql2/promise` connection pooling
- **Persistent Asset Storage:** Cloudinary REST API with server-side buffer streaming (independent of Render's ephemeral container filesystem)
- **Image Processing & Sanitization:** Sharp (magic-byte validation, format conversion, EXIF/GPS metadata stripping)
- **Security & Session Management:** `express-session`, `helmet`, `bcrypt`, `connect-flash`, `express-rate-limit`
- **Authentication:** Passport.js with Google OAuth 2.0 and local password authentication

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser Layer                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / TLS
┌──────────────────────────────▼──────────────────────────────┐
│           Express 5 Application Layer (MVC Pattern)         │
│  - Middleware: Morgan → BodyParsers → Session → Helmet      │
│  - Auth Guard: requireLogin, requireRole                    │
│  - Security: Rate Limiting, Sanitization, Magic Bytes       │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     Filess.io MySQL DB      ││     Cloudinary Cloud Store   │
│  - users                    ││  - Private Image Assets      │
│  - categories               ││  - feedback/{uuid}           │
│  - feedback                 ││  - Authenticated Proxy       │
│  - feedback_status_history  │└──────────────────────────────┘
│  - feedback_responses       │
│  - chat_conversations       │
└─────────────────────────────┘
```

---

## 4. Functional Requirements (FR)

### FR-01: User Registration & Authentication
- **FR-01.1:** System shall permit students to register locally with full name, valid email, student ID (optional), department, and password (minimum 8 characters, at least 1 letter and 1 number).
- **FR-01.2:** System shall offer one-click "Sign in with Google" via OAuth 2.0.
- **FR-01.3:** Returning users shall be recognized by verified email; new OAuth users shall have a student profile automatically provisioned in the MySQL `users` table.
- **FR-01.4:** Password hashes shall be computed using `bcrypt` with a cost factor of 12 prior to database insertion.
- **FR-01.5:** Sessions shall be regenerated upon login to prevent session fixation attacks (`req.session.regenerate`).
- **FR-01.6:** Logout shall be executed strictly via HTTP POST to prevent Cross-Site Request Forgery on state changes.

### FR-02: Structured Feedback Submission
- **FR-02.1:** Form submissions shall require:
  - **Type:** Controlled enum (`suggestion`, `complaint`, `concern`, `general_feedback`, `appreciation`).
  - **Category:** Valid foreign key referencing active `categories` records (`Academic`, `Facilities`, `Student Services`, `Security`, etc.).
  - **Priority:** Controlled enum (`low`, `medium`, `high`).
  - **Subject:** Text between 5 and 255 characters.
  - **Description:** Text between 10 and 5,000 characters.
- **FR-02.2:** Form submissions shall optionally accept an `isAnonymous` boolean toggle.
- **FR-02.3:** Form submissions shall optionally accept a single file attachment via `multipart/form-data`.

### FR-03: Dynamic Reference Number Assignment
- **FR-03.1:** Every valid submission shall be automatically assigned an immutable reference number formatted as `FB-YYYY-#####` (e.g., `FB-2026-00042`).
- **FR-03.2:** Reference numbers shall be sequential per calendar year, generated atomically within an active database transaction.

### FR-04: Student Ownership & Personal Dashboard
- **FR-04.1:** Students shall access `/student/dashboard` displaying aggregate metrics: Total Submissions, Pending, In Progress, Resolved, and Closed.
- **FR-04.2:** Students shall view `/feedback` containing a tabular list of their personal submissions.
- **FR-04.3:** Students shall view `/feedback/:id` displaying full details, current status, historical timeline, attached image, and official administrative replies.
- **FR-04.4:** Students shall be strictly restricted from viewing records authored by other users (ownership-scoped queries).

### FR-05: Anonymous Feedback Protection
- **FR-05.1:** When `isAnonymous = 1`, the student's primary foreign key `user_id` shall be persisted in the `feedback` table to preserve personal dashboard visibility.
- **FR-05.2:** All administrative queries shall mask the student's name, email, student ID number, and user ID as `NULL` using SQL `CASE WHEN f.is_anonymous = 1 THEN NULL ELSE ... END`.
- **FR-05.3:** Anonymous submissions shall redirect to `/student/dashboard` with a flash confirmation to prevent exposing the new record ID in the URL.

### FR-06: Administrative Feedback Management
- **FR-06.1:** Access to `/admin/*` shall be restricted server-side to accounts where `role = 'admin'`.
- **FR-06.2:** Admins shall view institutional aggregate statistics on `/admin/dashboard`.
- **FR-06.3:** Admins shall filter feedback by status, category, type, and priority, perform keyword searches on subjects/references, and paginate results.
- **FR-06.4:** Admins shall update feedback status via `POST /admin/feedback/:id/status`. Each update shall append an immutable audit record to `feedback_status_history`.
- **FR-06.5:** Admins shall post official responses via `POST /admin/feedback/:id/respond`, saved into `feedback_responses`.

### FR-07: Persistent Image Attachment Pipeline
- **FR-07.1:** The server shall process uploads directly in memory (`multer.memoryStorage()`) to prevent data loss on Render's ephemeral filesystem.
- **FR-07.2:** File size shall not exceed 5 MB (5,242,880 bytes).
- **FR-07.3:** Image format shall be strictly verified via magic-byte inspection (Sharp) for JPEG, PNG, or WebP.
- **FR-07.4:** The file buffer shall be re-encoded by Sharp, stripping all EXIF, GPS, and device metadata.
- **FR-07.5:** The sanitized image shall be uploaded to Cloudinary as a `private` asset with a randomized UUID (`feedback/{uuid}`).
- **FR-07.6:** The database shall store `image_public_id` and `image_mime_type`.
- **FR-07.7:** Images shall be served exclusively via authenticated backend endpoints (`/feedback/:id/image` and `/admin/feedback/:id/image`). No direct public Cloudinary URLs shall be exposed.

### FR-08: Aizen AI Virtual Assistant & Escalation
- **FR-08.1:** Public and authenticated visitors can interact with Aizen AI (powered by Google Gemini) via a floating widget.
- **FR-08.2:** The bot shall answer inquiries regarding school feedback categories, submission procedures, and look up public status by reference number.
- **FR-08.3:** Users can escalate a conversation to a human administrator via `/api/chat/escalate`.
- **FR-08.4:** Admins shall view and reply to escalated chats via `/admin/chat` and `/admin/chat/:id`.

---

## 5. Non-Functional Requirements (NFR)

### NFR-01: Security & Cryptographic Standards
- **NFR-01.1:** Passwords shall be hashed using `bcrypt` (12 rounds). Plaintext passwords shall never be logged or stored.
- **NFR-01.2:** Session cookies shall have flags `HttpOnly: true`, `SameSite: 'lax'`, and `Secure: true` in production environments.
- **NFR-01.3:** HTTP response headers shall be hardened using `helmet`, including a strict `Content-Security-Policy`.
- **NFR-01.4:** Sensitive environment variables (`DB_PASSWORD`, `SESSION_SECRET`, `CLOUDINARY_API_SECRET`, `GEMINI_API_KEY`) shall never be committed to Git.

### NFR-02: Injection & Tampering Defense
- **NFR-02.1 (SQL Injection):** All database operations without exception shall utilize parameterized queries (`?` placeholders) via the `mysql2/promise` API.
- **NFR-02.2 (Cross-Site Scripting - XSS):** EJS templates shall render all user-controlled text using standard escaped tags (`<%= %>`). Raw unescaped rendering (`<%- %>`) is prohibited for dynamic text.
- **NFR-02.3 (Insecure Direct Object Reference - IDOR):** Student data access endpoints shall mandate database-level scoping: `WHERE id = ? AND user_id = ?`.

### NFR-03: Data Integrity & Transactions
- **NFR-03.1:** Multi-table writes (inserting feedback + generating reference number + inserting initial status history) shall execute within atomic MySQL transactions (`START TRANSACTION` &rarr; `COMMIT` / `ROLLBACK`).
- **NFR-03.2:** If database operations fail after an external Cloudinary asset upload, an automated rollback handler shall trigger `attachmentStorage.deleteFeedbackImage()` to prevent orphaned cloud files.

### NFR-04: Availability & Cloud Resilience
- **NFR-04.1:** The deployed system on Render shall operate continuously and autonomously without dependency on any local developer workstation.
- **NFR-04.2:** MySQL connection pooling (`connectionLimit: 2`) shall prevent exceeding Filess.io server connection ceilings during redeployments.
- **NFR-04.3:** Sensitive endpoints (`/auth/login`, `/auth/register`, `/feedback`, `/api/chat`) shall enforce IP-based rate limiting to mitigate brute-force and Denial-of-Service attempts.

### NFR-05: Usability & Accessibility (a11y)
- **NFR-05.1:** Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) shall be used throughout.
- **NFR-05.2:** Status badges and priority indicators shall not rely on color alone; visible text labels and semantic ARIA attributes shall be provided.
- **NFR-05.3:** Forms shall announce validation errors dynamically via `role="alert"` containers.

---

## 6. Midterm Round 1 Grading Rubric Compliance Matrix

This matrix maps the official course requirements directly to implementation evidence and audit status:

| Criterion | Point Weight | Expected Standards | Implementation Evidence | Round 1 Status |
|---|---|---|---|:---:|
| **1. Application & Architecture** | 15% | Express + Node running with real routes, clean MVC separation, proper middleware stack, error handling, independent cloud hosting. | • Express 5.2.1 modular structure (`app.js`, `server.js`).<br>• Live domain `https://cspcfeedbacksuggest.me` on Render.<br>• 15+ functional EJS views, 4 centralized error templates.<br>• Centralized 4-argument error middleware. | **VERIFIED PASS** |
| **2. Forms & Server Validation** | 20% | All forms validate on the server before database write; reject empty, out-of-range, and malformed data; return helpful errors and retain input. | • [`lib/validation.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/lib/validation.js) pure validators with 56 passing unit tests.<br>• Feedback form returns `HTTP 422` with repopulated `formData`.<br>• Image validation via Sharp (5 MB cap, magic bytes, re-encoding). | **VERIFIED PASS** |
| **3. MySQL Database** | 20% | Relational MySQL database with normalized tables, primary/foreign keys, transactions, 100% parameterized queries. | • Filess.io MySQL host (`nxu1wb.h.filess.io:61002`).<br>• 7 normalized tables: `users`, `categories`, `feedback`, `feedback_status_history`, `feedback_responses`, `chat_conversations`, `chat_messages`.<br>• 11 users, 92 feedback records live in database.<br>• Atomic transactions in `models/feedbackModel.js`. | **VERIFIED PASS** |
| **4. Access Control & Privacy** | 20% | Server-side role authorization; students strictly isolated to their own records; URL tampering prevented (IDOR); anonymous identity masked. | • Server-side `requireLogin` + `requireRole` middleware.<br>• SQL ownership check: `WHERE f.id = ? AND f.user_id = ?`.<br>• Attempted access to another student's record yields `404 Not Found`.<br>• Anonymous feedback masks student identity in all admin queries. | **VERIFIED PASS** |
| **5. GitHub Collaboration** | 15% | Active repository with feature branches, Pull Requests, code reviews, and visible contributions from all three group members. | • Repository: `sammarj05/CSPC-FEEDBACK-SUGGESTION`.<br>• Git history currently shows 11 commits by 1 member (`Sam`).<br>• Zero PRs or branch activity from Members 2 and 3. | **ACTION REQUIRED (Team Blocker)** |
| **6. Project Documentation** | 10% | Comprehensive SRS / Requirements document and complete AI-Assisted Development Log with transparent disclosure. | • Requirements documented in [`REQUIREMENTS.md`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/REQUIREMENTS.md).<br>• AI usage disclosed in [`AI-ASSISTED-DEVELOPMENT-LOG.md`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/AI-ASSISTED-DEVELOPMENT-LOG.md). | **VERIFIED PASS** |

---

## 7. Requirements Traceability Matrix (RTM)

| Req ID | Description | Source File / Implementation | Automated Test Evidence | Verification Status |
|---|---|---|---|:---:|
| **FR-01** | Student Register & Login | [`controllers/authController.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/controllers/authController.js), [`routes/authRoutes.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/routes/authRoutes.js) | `tests/auth.test.js` (21 tests pass) | **VERIFIED PASS** |
| **FR-02** | Form Validation | [`lib/validation.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/lib/validation.js), [`views/student/feedback-form.ejs`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/views/student/feedback-form.ejs) | `tests/validation.test.js` (56 tests pass) | **VERIFIED PASS** |
| **FR-03** | Reference Number | [`models/feedbackModel.js:L24-L50`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/models/feedbackModel.js#L24-L50) | `tests/feedback.test.js` (Test 1 passes) | **VERIFIED PASS** |
| **FR-04** | Ownership / IDOR | [`models/feedbackModel.js:L158-L168`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/models/feedbackModel.js#L158-L168) | `tests/feedback.test.js` (Tests 3 & 6 pass) | **VERIFIED PASS** |
| **FR-05** | Anonymous Masking | [`models/feedbackModel.js:L181-L244`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/models/feedbackModel.js#L181-L244) | `tests/feedback.test.js` (Tests 2 & 4 pass) | **VERIFIED PASS** |
| **FR-06** | Admin Status/Reply | [`controllers/adminController.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/controllers/adminController.js), [`models/responseModel.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/models/responseModel.js) | `tests/feedback.test.js` (Test 7c passes) | **VERIFIED PASS** |
| **FR-07** | Image Attachment | [`lib/attachmentValidation.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/lib/attachmentValidation.js), [`services/attachmentStorageService.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/services/attachmentStorageService.js) | `tests/attachment.test.js` (11 tests pass) | **VERIFIED PASS** |
| **FR-08** | Aizen AI Chat | [`controllers/chatController.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/controllers/chatController.js), [`models/chatModel.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/models/chatModel.js) | `tests/chat.test.js` (18 tests pass) | **VERIFIED PASS** |
| **NFR-01** | Passwords & Session | [`config/passport.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/config/passport.js), [`app.js:L78-L91`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/app.js#L78-L91) | `tests/auth.test.js` | **VERIFIED PASS** |
| **NFR-02** | SQL Parameterization | All files under `models/*.js` | Zero SQL concatenation found | **VERIFIED PASS** |
| **NFR-03** | Atomic Transactions | [`models/feedbackModel.js:L80-L122`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/models/feedbackModel.js#L80-L122) | Source code verified | **VERIFIED PASS** |
| **NFR-04** | Cloud Deployment | Render Web Service + Filess.io MySQL | Live HTTP 200 response | **VERIFIED PASS** |

---

## 8. Failure-Case & Boundary Behavior Specifications

The system enforces deterministic error handling across all four required failure-case scenarios:

### Scenario 1: Malformed / Empty Form Submission
- **Input:** Student posts empty subject or description below 10 characters.
- **Handling:** `feedbackController.submitFeedback` invokes `validateFeedbackSubmission()`.
- **Expected Outcome:** Rejection with `HTTP 422 Unprocessable Entity`. EJS view displays error list and preserves valid user input in `formData`.
- **Status:** **PASS** (Verified by `tests/validation.test.js`).

### Scenario 2: Rapid Duplicate Submission
- **Input:** Student double-clicks submit or refreshes page after posting.
- **Handling:** Client-side JavaScript disables the submit button immediately upon form submission (`public/js/main.js`). The controller adheres to the Post/Redirect/Get pattern (`res.redirect(303, ...)`). Express rate limiting (`submitLimiter`) caps submissions to 5 per 10 minutes per IP.
- **Expected Outcome:** Duplicate submission prevented; refresh displays detail page without creating a second record.
- **Status:** **PASS**.

### Scenario 3: Unauthorized Record Access (IDOR Attempt)
- **Input:** Student A attempts to access `GET /feedback/42` belonging to Student B.
- **Handling:** The query executes `SELECT ... WHERE id = 42 AND user_id = [Student A ID] LIMIT 1`.
- **Expected Outcome:** Zero rows returned. Controller renders `views/errors/404.ejs` with `HTTP 404 Not Found`. Neither data nor existence of the record is leaked.
- **Status:** **PASS** (Verified by `tests/feedback.test.js` Test 6).

### Scenario 4: Unauthenticated Access to Protected Resource
- **Input:** Unauthenticated user attempts `GET /student/dashboard`, `GET /feedback/new`, or `GET /admin/dashboard`.
- **Handling:** Intercepted by `requireLogin` middleware.
- **Expected Outcome:** Immediate `HTTP 302` redirect to `/auth/login` with flash error banner *"Please log in to access that page."* Admin routes return `403 Access Denied` if authenticated as student.
- **Status:** **PASS** (Verified by `tests/feedback.test.js` lines 5–71).

---

## 9. Round 2 Future Roadmap

Following successful completion of the Midterm Round 1 evaluation, the engineering team has scheduled the following enhancements for the Final Round:

1. **Automated Notification Delivery:** Integrate SendGrid and Twilio to dispatch email and SMS alerts to students whenever an administrator updates their feedback status.
2. **Community Voting & Endorsements:** Allow students to optionally publish suggestions to a public board where peers can upvote or comment.
3. **Dean & Office Executive Reporting:** Automated PDF and Excel export generating monthly SLA and resolution performance reports by campus department.
4. **Enhanced Two-Factor Authentication (2FA):** Time-based One-Time Password (TOTP) support for administrative logins.
