# AI-Assisted Development Log & Academic Disclosure

> **Project:** CSPC Suggestion & Feedback System  
> **Institution:** Camarines Sur Polytechnic Colleges (CSPC)  
> **Course:** CCIT 106 — Application Development and Emerging Technologies  
> **Academic Phase:** Midterm Round 1  
> **Repository:** [https://github.com/sammarj05/CSPC-FEEDBACK-SUGGESTION](https://github.com/sammarj05/CSPC-FEEDBACK-SUGGESTION)  
> **Primary Developer:** Sam (Student Lead)  
> **Last Updated:** October 2026  
> **Status:** Audited, Corrected, and Fully Disclosed

---

## Table of Contents
1. [Project & Course Information](#1-project--course-information)
2. [Purpose of this Document](#2-purpose-of-this-document)
3. [AI Tools Used](#3-ai-tools-used)
4. [Student Developer's Role & Responsibilities](#4-student-developers-role--responsibilities)
5. [AI-Assisted Development Methodology](#5-ai-assisted-development-methodology)
6. [Chronological Development Entries](#6-chronological-development-entries)
   - [Entry 001: Initial Architecture, MVC Scaffold & Core Features](#entry-001-initial-architecture-mvc-scaffold--core-features-2026-09-25)
   - [Entry 002: Google OAuth 2.0 Integration & Account Provisioning](#entry-002-google-oauth-20-integration--account-provisioning-2026-09-25)
   - [Entry 003: Render Reverse Proxy Hardening & Session Cookies](#entry-003-render-reverse-proxy-hardening--session-cookies-2026-09-26)
   - [Entry 004: Anonymous Feedback Privacy Architecture & Ownership Scoping](#entry-004-anonymous-feedback-privacy-architecture--ownership-scoping-2026-09-27)
   - [Entry 005: Aizen AI Virtual Assistant & Gemini API Integration](#entry-005-aizen-ai-virtual-assistant--gemini-api-integration-2026-09-27)
   - [Entry 006: Persistent Cloudinary Image Storage & Sharp Processing](#entry-006-persistent-cloudinary-image-storage--sharp-processing-2026-09-30-to-2026-10-01)
   - [Entry 007: Midterm Compliance Audit, Automated Tests & Requirements Matrix](#entry-007-midterm-compliance-audit-automated-tests--requirements-matrix-2026-10-01)
7. [AI Assistance by Development Area](#7-ai-assistance-by-development-area)
8. [Debugging & Error-Resolution Records](#8-debugging--error-resolution-records)
9. [Testing & Verification Evidence](#9-testing--verification-evidence)
10. [Security & Privacy Verification Review](#10-security--privacy-verification-review)
11. [Corrections to Earlier Documentation (Audit Errata)](#11-corrections-to-earlier-documentation-audit-errata)
12. [Limitations, Technical Debt & Outstanding Issues](#12-limitations-technical-debt--outstanding-issues)
13. [Final Reflection on AI-Assisted Development](#13-final-reflection-on-ai-assisted-development)

---

## 1. Project & Course Information

The **CSPC Suggestion & Feedback System** is a full-stack web application developed for **Camarines Sur Polytechnic Colleges (CSPC)** under **CCIT 106 — Application Development and Emerging Technologies**. The application provides students with a digital portal to voice suggestions, complaints, concerns, and appreciation, while enabling authorized administrators to triage, track, and officially resolve student concerns.

---

## 2. Purpose of this Document

In accordance with institutional guidelines and academic integrity standards for CCIT 106, this log provides a transparent, chronological, and technically accurate disclosure of how Artificial Intelligence (AI) tools were utilized during the development lifecycle.

This document serves to:
1. **Disclose AI Assistance:** Identify specific domains where AI assisted with code generation, structural planning, debugging, and testing.
2. **Affirm Student Authorship & Governance:** Document the student developer's decisions, architectural oversight, validation runs, and manual problem-solving.
3. **Correct Prior Inaccuracies:** Formally correct previous documentation discrepancies (e.g., OAuth domain restrictions and CSRF claims) so the academic record accurately matches source code reality.
4. **Demonstrate Software Engineering Verification:** Provide verifiable evidence that all AI-suggested code was inspected, tested, and validated against actual requirements.

---

## 3. AI Tools Used

The following AI models and developer tooling were utilized:

| AI Tool / Model | Provider | Development Scope |
|---|---|---|
| **Google Antigravity (Claude Sonnet 4.6 Thinking)** | Anthropic / Google | Initial application scaffolding, core MVC modules, unit test design, Aizen AI controller, and security review. |
| **Google Antigravity (Gemini 3.8 Flash)** | Google DeepMind | Cloudinary image upload pipeline, Sharp validation, test runner debugging, and compliance audit. |
| **Google Gemini API (`@google/generative-ai`)** | Google Cloud | Runtime AI engine powering the live **Aizen AI** student assistant widget. |

---

## 4. Student Developer's Role & Responsibilities

AI was utilized strictly as an **interactive engineering assistant** (pair programmer, architectural sounding board, and troubleshooter). The student developer remained in full control and executed the following responsibilities:
- **Product Direction:** Defined institutional CSPC workflows, user roles, feedback categorization, and anonymous privacy policies.
- **Architectural Decision-Making:** Selected the relational database model, rejected local disk uploads for ephemeral cloud deployment, and chose Cloudinary authenticated proxying.
- **Manual Verification:** Configured database instances (Filess.io), created Render services, configured Google Cloud Console OAuth 2.0 credentials, and verified production behavior in live browsers.
- **Quality Assurance:** Executed automated unit and integration tests (`vitest`), inspected test outputs, and identified edge-case defects.
- **Security & Integrity Ownership:** Audited SQL queries for parameterization, verified role-based guards, and ensured that no database credentials or API secrets were committed to public version control.

---

## 5. AI-Assisted Development Methodology

Development followed an iterative cycle:
```
[Student Requirement Definition] 
       │
       ▼
[AI Analysis & Draft Implementation] 
       │
       ▼
[Student Inspection & Code Review] 
       │
       ▼
[Automated & Manual Verification (Vitest / Browser / MySQL)] 
       │
       ▼
[Identification of Defects / Edge Cases] 
       │
       ▼
[Collaborative Troubleshooting & Final Integration]
```

---

## 6. Chronological Development Entries

---

### Entry 001: Initial Architecture, MVC Scaffold & Core Features (2026-09-25)

- **Development Stage:** Phase 1 – Phase 11 Foundation
- **Objective:** Establish the foundational architecture, Express server, database schema, authentication, feedback workflows, and testing harness.
- **Nature of AI Assistance:**
  - Generated the initial directory structure adhering to standard Node.js/Express MVC.
  - Drafted core models (`userModel.js`, `feedbackModel.js`, `categoryModel.js`, `responseModel.js`).
  - Drafted EJS templates with semantic HTML5, vanilla CSS styling, and accessible form inputs.
  - Provided pure validation routines in `lib/validation.js`.
  - Created initial Vitest test suites (`tests/validation.test.js`, `tests/auth.test.js`, `tests/feedback.test.js`).
- **Student Review & Implementation:**
  - Reviewed all SQL statements to ensure strict parameterization (`?` placeholders).
  - Detected and fixed an email validation boundary defect where a 255-character input was incorrectly expected to fail.
  - Resolved a Vite CommonJS loader warning by renaming `vitest.config.js` to `vitest.config.mjs`.
  - Noted `csurf` deprecation warnings during package installation.
- **Files Affected:**
  - [`app.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/app.js), [`server.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/server.js), [`schema.sql`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/schema.sql), [`seed.sql`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/seed.sql)
  - `controllers/`, `models/`, `routes/`, `views/`, `public/css/`
- **Testing & Verification Evidence:**
  - Ran `npx vitest run tests/validation.test.js` — 56/56 unit tests passed.
  - Verified local database connection and schema initialization in MySQL.
- **Outcome & Limitations:**
  - Core CRUD and authentication working locally.
  - *Identified Limitation:* The initial plan noted `csrf-csrf` as a replacement for `csurf`, but middleware integration was deferred, leaving form submissions protected by `SameSite=Lax` cookies rather than explicit tokens.

---

### Entry 002: Google OAuth 2.0 Integration & Account Provisioning (2026-09-25)

- **Development Stage:** Authentication & Identity Management
- **Objective:** Enable "Sign in with Google" so students can log in without creating a manual password.
- **Nature of AI Assistance:**
  - Generated Passport.js Google Strategy configuration in `config/passport.js`.
  - Added OAuth initiation (`/auth/google`) and callback (`/auth/google/callback`) routes in `routes/authRoutes.js`.
  - Added user auto-provisioning logic (`userModel.createStudentOAuth`).
  - Styled the Google login button and auth divider in `views/auth/login.ejs` and `views/auth/register.ejs`.
- **Student Review & Implementation:**
  - Configured OAuth 2.0 Client ID and Secret in Google Cloud Console.
  - Set up redirect URIs for both localhost (`http://localhost:3000/auth/google/callback`) and production (`https://cspcfeedbacksuggest.me/auth/google/callback`).
  - Added `google_id` and `avatar` columns to `schema.sql`.
  - *Policy Decision on Domain Restriction:* While institutional `@cspc.edu.ph` filtering was initially discussed, during testing with personal developer accounts the domain restriction check was disabled so testing could proceed.
- **Files Affected:**
  - [`config/passport.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/config/passport.js), [`models/userModel.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/models/userModel.js), [`routes/authRoutes.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/routes/authRoutes.js)
- **Testing & Verification Evidence:**
  - Verified end-to-end OAuth flow in browser: authenticated with Google, confirmed student account creation in `users` table, and verified session persistence.
- **Outcome & Limitations:**
  - *Documentation Correction:* Previous log entries claimed active domain restriction to `@cspc.edu.ph`. In reality, the codebase currently allows any valid Google account to log in.

---

### Entry 003: Render Reverse Proxy Hardening & Session Cookies (2026-09-26)

- **Development Stage:** Production Deployment Hardening
- **Objective:** Fix session cookie dropping when deployed to Render behind a reverse proxy over HTTPS.
- **Nature of AI Assistance:**
  - Analyzed production logs showing students being redirected back to login immediately after authenticating.
  - Diagnosed that Render terminates TLS at Cloudflare/reverse proxy and forwards plain HTTP internally. Because Express session was configured with `cookie.secure = true`, Express refused to transmit the cookie without recognizing HTTPS.
  - Recommended adding `app.set("trust proxy", 1)`.
- **Student Review & Implementation:**
  - Added conditional proxy trusting in `app.js` (`if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);`).
  - Updated `.env.example` with clear instructions for deployment.
- **Files Affected:**
  - [`app.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/app.js) (Git commit `e04b5bf`)
- **Testing & Verification Evidence:**
  - Deployed to Render, authenticated on `https://cspcfeedbacksuggest.me`, and verified that `connect.sid` cookie was successfully retained with `HttpOnly`, `Secure`, and `SameSite=Lax` attributes.

---

### Entry 004: Anonymous Feedback Privacy Architecture & Ownership Scoping (2026-09-27)

- **Development Stage:** Core Logic Hardening & Privacy Engineering
- **Objective:** Ensure anonymous feedback hides student identity from administrators while still allowing the submitting student to track their submission on their personal dashboard.
- **Nature of AI Assistance:**
  - Identified a critical flaw in the initial prototype: setting `user_id = NULL` for anonymous feedback prevented the student from viewing their own submission in `/feedback`.
  - Designed the dual-view architecture:
    1. Persist the genuine student `user_id` in the `feedback` table.
    2. Enforce privacy at the query level using SQL masking:
       ```sql
       CASE WHEN f.is_anonymous = 1 THEN NULL ELSE u.name END AS student_name
       ```
    3. Retain ownership scoping for students (`WHERE f.id = ? AND f.user_id = ?`).
- **Student Review & Implementation:**
  - Updated `feedbackModel.js` (`create`, `findByReference`, `findByIdAdmin`, `adminList`).
  - Updated `feedbackController.js` to redirect anonymous feedback submissions to `/student/dashboard` with a flash message containing the reference number, preventing record ID exposure in the URL.
  - Added dedicated Privacy Policy view (`views/privacy-policy.ejs`).
- **Files Affected:**
  - [`models/feedbackModel.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/models/feedbackModel.js), [`controllers/feedbackController.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/controllers/feedbackController.js), [`views/privacy-policy.ejs`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/views/privacy-policy.ejs)
  - Git commits `0fc21c0`, `2ee0d2a`, `2d864e9`.
- **Testing & Verification Evidence:**
  - Added comprehensive automated tests in `tests/feedback.test.js` (Tests 1–7):
    - Verified anonymous feedback displays on submitting student's dashboard.
    - Verified anonymous feedback is completely hidden from other students (IDOR test returns 404).
    - Verified administrator queries return `student_name = null` and `user_id = null`.
    - Verified administrator can still update status and add responses.

---

### Entry 005: Aizen AI Virtual Assistant & Gemini API Integration (2026-09-27)

- **Development Stage:** Emerging Tech / AI Chatbot Feature
- **Objective:** Implement an in-app virtual assistant powered by Google Gemini to assist students with campus procedures and reference tracking.
- **Nature of AI Assistance:**
  - Implemented `@google/generative-ai` integration in `controllers/chatController.js`.
  - Designed institutional system instructions restricting the bot to CSPC feedback domain queries.
  - Implemented automatic Gemini model fallback (`gemini-2.5-flash` &rarr; `gemini-3.5-flash` &rarr; `gemini-3.8-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-2.5-flash-lite`) to survive quota and rate limit errors.
  - Built chat database models (`chat_conversations`, `chat_messages`) in `models/chatModel.js`.
  - Created client-side chat widget in `public/js/chat.js` and floating UI in `views/partials/chat-widget.ejs`.
  - Implemented administrative escalation endpoint (`/api/chat/escalate`) and admin conversation views (`/admin/chat`).
- **Student Review & Implementation:**
  - Created Gemini API key in Google AI Studio and configured it in local `.env` and Render environment.
  - Tested chat rate limiting (20 messages per 10 minutes per IP).
  - Executed database migration using `chat-schema.sql` on Filess.io MySQL.
  - Wrote 18 automated security and invariant tests in `tests/chat.test.js`.
- **Files Affected:**
  - `controllers/chatController.js`, `models/chatModel.js`, `routes/chatRoutes.js`, `views/partials/chat-widget.ejs`, `public/css/chat.css`, `public/js/chat.js`, `chat-schema.sql`, `tests/chat.test.js`.
  - Git commits `ca04cdc`, `e724cdd`, `86c3f33`.
- **Testing & Verification Evidence:**
  - Ran `npx vitest run tests/chat.test.js` — 18/18 tests passed.
  - Verified that `GEMINI_API_KEY` is strictly server-side and never exposed to the client browser.
  - Tested model fallback behavior when primary models encounter 400/429 errors.

---

### Entry 006: Persistent Cloudinary Image Storage & Sharp Processing (2026-09-30 to 2026-10-01)

- **Development Stage:** Persistent Storage Migration for Production
- **Objective:** Transition feedback image attachments from local disk storage to persistent cloud storage so attachments survive Render's ephemeral container restarts and redeployments.
- **Nature of AI Assistance:**
  - Architected memory-to-cloud upload pipeline:
    1. Multer receives upload directly into memory buffer (`storage: multer.memoryStorage()`).
    2. Sharp inspects real image magic bytes, enforces 5 MB limit, and re-encodes images to strip EXIF, device, and GPS metadata.
    3. Asset is uploaded to Cloudinary as a `private` resource (`type: 'private'`) under `feedback/{uuid}`.
    4. Database stores only asset identifier (`image_public_id`) and MIME type (`image_mime_type`).
    5. Express backend streams image via authenticated routes (`/feedback/:id/image`, `/admin/feedback/:id/image`), preventing public exposure of raw Cloudinary URLs.
  - Created idempotent database migration runner (`scripts/migrate-images.js`) and SQL migration (`migrations/20260930_add_feedback_image_attachments.sql`).
  - Added unit test suite `tests/attachment.test.js` covering image validation, memory limits, storage service, and route authorization.
- **Student Review & Implementation:**
  - Registered free-tier account on Cloudinary.
  - Troubleshot `Invalid cloud_name image` error when local `.env` was misconfigured with the literal string `image`.
  - Added `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to Render Web Service dashboard.
  - Executed `node scripts/migrate-images.js` against the live Filess.io production database.
- **Files Affected:**
  - [`config/cloudinary.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/config/cloudinary.js), [`lib/attachmentValidation.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/lib/attachmentValidation.js), [`middleware/uploadMiddleware.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/middleware/uploadMiddleware.js), [`services/attachmentStorageService.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/services/attachmentStorageService.js), [`services/attachmentDeliveryService.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/services/attachmentDeliveryService.js), [`scripts/migrate-images.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/scripts/migrate-images.js), [`tests/attachment.test.js`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/tests/attachment.test.js).
- **Testing & Verification Evidence:**
  - Executed `npx vitest run tests/attachment.test.js` — 11/11 tests passed.
  - Verified schema migration on Filess.io MySQL: columns `image_public_id` and `image_mime_type` confirmed present.
  - Verified full test suite (`npm test`) — 126/126 tests passed across all 5 test suites.

---

### Entry 007: Midterm Compliance Audit, Automated Tests & Requirements Matrix (2026-10-01)

- **Development Stage:** Quality Assurance, Security Audit & Academic Compliance
- **Objective:** Conduct a comprehensive audit against official CCIT 106 Midterm Round 1 requirements and produce complete compliance documentation.
- **Nature of AI Assistance:**
  - Audited full source code, live database, Git history, and deployment endpoints.
  - Identified critical non-code academic gaps:
    1. Lack of Git branches/PRs from other group members.
    2. Missing official course requirements document.
    3. Documentation discrepancies regarding OAuth domain filtering and CSRF tokens.
  - Generated formal Software Requirements Specification document ([`REQUIREMENTS.md`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/REQUIREMENTS.md)) containing Functional Requirements, Non-Functional Requirements, Grading Rubric Compliance Matrix, Requirements Traceability Matrix, and Failure-Case Specifications.
- **Student Review & Implementation:**
  - Reviewed and verified all audit findings against actual repository contents.
  - Adopted the Prioritized Fix Plan to address team collaboration requirements before demo day.
- **Files Affected:**
  - [`REQUIREMENTS.md`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/REQUIREMENTS.md), [`AI-ASSISTED-DEVELOPMENT-LOG.md`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/AI-ASSISTED-DEVELOPMENT-LOG.md).
- **Testing & Verification Evidence:**
  - Executed all 5 Vitest suites: 126 passed.
  - Verified live deployment `https://cspcfeedbacksuggest.me` responds with HTTP 200 and security headers.

---

## 7. AI Assistance by Development Area

### A. Planning & Requirements Analysis
- AI assisted in decomposing the high-level concept into clear user stories for Students and Administrators.
- Assisted in mapping database entities (`users`, `categories`, `feedback`, `status_history`, `responses`, `chats`) and determining cardinalities.
- Outlined edge cases such as anonymous tracking, oversized attachments, and server restart survival.

### B. Application Architecture & Project Setup
- Guided Express 5 application setup with clean separation between `app.js` (Express configuration and middleware pipeline) and `server.js` (port binding and process listener), enabling isolated SuperTest execution.
- Formulated environment variable management strategy via `dotenv` and safe placeholders in `.env.example`.

### C. Frontend & User Interface
- Structured EJS layouts with modular reusable partials (`navbar.ejs`, `footer.ejs`, `errors.ejs`, `priority-badge.ejs`, `status-badge.ejs`, `chat-widget.ejs`).
- Styled responsive layouts using vanilla CSS with custom design tokens (variables, color palettes, responsive flex/grid).
- Integrated accessible micro-interactions, character count indicators, and dynamic attachment previews.

### D. Backend & Application Logic
- Built Express route handlers with middleware layering (`requireLogin`, `requireRole`, rate limiters, Multer).
- Implemented transaction-safe database writes in `feedbackModel.js` ensuring reference number generation and status history creation are atomic.
- Enforced Post/Redirect/Get (PRG) patterns across all state-changing operations (`303 See Other`).

### E. Database Development
- Designed relational MySQL schema using InnoDB, utf8mb4 charset, foreign key constraints with `ON DELETE SET NULL`, and lookup indexes.
- Wrote 100% parameterized SQL statements with zero raw string interpolation.
- Provided idempotent migration scripts that query MySQL's `information_schema` before executing schema modifications.

### F. Authentication & Security
- Integrated Passport.js Google OAuth 2.0 with session-based serialization.
- Implemented `bcrypt` password hashing (cost factor 12) with generic failure responses preventing username enumeration.
- Enforced database-level IDOR protection: all student queries include `WHERE user_id = ?`.
- Configured Helmet HTTP security headers including Content-Security-Policy (CSP).

### G. Aizen Chatbot & Gemini API
- Designed system prompts grounding Gemini responses strictly to CSPC campus feedback policies.
- Implemented dynamic multi-model fallback routines to handle API rate limits and model deprecations.
- Enforced server-side mediation: the Google Gemini API key is never exposed to the browser.

### H. Image Uploads & Cloudinary
- Implemented in-memory Multer handling to accommodate Render's ephemeral filesystem constraints.
- Integrated Sharp for magic-byte verification and EXIF metadata stripping.
- Structured Cloudinary private asset uploads with authenticated proxy streaming via backend Express endpoints.

### I. Debugging & Error Resolution
- Assisted in diagnosing runtime errors, asynchronous test hoisting issues, database connection pool exhaustion, and reverse proxy cookie drops.

### J. Testing & Quality Assurance
- Developed comprehensive unit and integration test suites using Vitest and SuperTest.
- Tested failure cases: invalid form submissions, rapid duplicates, unauthenticated requests, and cross-student IDOR attempts.

### K. Deployment & Hosting
- Guided deployment configuration for Render Web Services.
- Configured Filess.io remote MySQL connection pool parameters to comply with external connection limits.
- Configured custom domain SSL routing on Cloudflare.

### L. Documentation & Development Workflow
- Structured technical README documentation, software requirements specifications (`REQUIREMENTS.md`), defect tracking (`DEFECT-LOG.md`), and presentation scripts (`PITCH_PRESENTATION_SCRIPT.md`).

---

## 8. Debugging & Error-Resolution Records

The following verified development issues were investigated and resolved with AI assistance:

| Issue ID | Problem Encountered | Investigation / Root Cause | AI-Assisted Solution | Verification Method & Outcome |
|---|---|---|---|---|
| **DBG-01** | `validateEmail()` boundary test failed | Test created a 255-char email and expected `false`. However, the max limit was 255, so it was valid. | Corrected test input to 256 characters (`"a".repeat(251) + "@x.ph"`). | Ran `vitest run tests/validation.test.js`. **Resolved** (56/56 passing). |
| **DBG-02** | Vite CJS loader warning on `vitest.config.js` | Configuration file used ESM `import` statements but was loaded as CommonJS by Vite. | Renamed configuration file to `vitest.config.mjs` to instruct Node/Vite to treat it as ESM. | Ran test suite. **Resolved** (zero loader warnings). |
| **DBG-03** | Session cookie dropped on Render production | Render reverse proxy terminates HTTPS, forwarding HTTP to Express. Express dropped `secure: true` cookies. | Added `app.set("trust proxy", 1)` in `app.js` when `NODE_ENV === "production"`. | Tested in production browser. Cookie persisted with `Secure; HttpOnly; SameSite=Lax`. **Resolved**. |
| **DBG-04** | Anonymous feedback disappeared from student view | Initial prototype stored `user_id = NULL` in database, causing `WHERE user_id = ?` queries to return empty. | Stored genuine `user_id` in database; applied SQL `CASE WHEN is_anonymous = 1 THEN NULL` in admin queries. | Verified via `tests/feedback.test.js` Tests 2, 3, and 4. **Resolved**. |
| **DBG-05** | Chat tests failed due to CJS dynamic import issues | Vitest `vi.mock()` failed to intercept CommonJS `require()` calls across asynchronously loaded test files. | Refactored tests to use source-code AST inspection for security invariants combined with SuperTest HTTP tests. | Ran `vitest run tests/chat.test.js`. **Resolved** (18/18 passing). |
| **DBG-06** | Gemini API 400 Bad Request on primary model | Default model `gemini-3.8-flash` rejected API calls during testing due to quota/model availability. | Implemented automatic candidate fallback loop trying alternate stable models (`gemini-2.5-flash`, etc.). | Tested live endpoint with invalid key/model. Graceful fallback verified without server crash. **Resolved**. |
| **DBG-07** | Multer disk upload files lost after Render restart | Render uses an ephemeral filesystem. Files written to local `/uploads` disappeared on container restart. | Replaced disk storage with `multer.memoryStorage()` + Sharp processing + Cloudinary persistent upload. | Uploaded image, redeployed service on Render, verified image remained viewable. **Resolved**. |
| **DBG-08** | Cloudinary error: `Invalid cloud_name image` | Local `.env` had line `CLOUDINARY_CLOUD_NAME=image` instead of actual account identifier. | Identified error in terminal logs, located actual cloud name from Cloudinary Dashboard, updated `.env`. | Restarted server, submitted feedback with image. Image uploaded and rendered successfully. **Resolved**. |

---

## 9. Testing & Verification Evidence

All features were verified using an automated Vitest test suite consisting of **5 test files and 126 tests** (100% passing):

```bash
$ npx vitest run

 ✓ tests/chat.test.js (18 tests)
 ✓ tests/auth.test.js (21 tests)
 ✓ tests/attachment.test.js (11 tests)
 ✓ tests/validation.test.js (56 tests)
 ✓ tests/feedback.test.js (20 tests)

 Test Files  5 passed (5)
      Tests  126 passed (126)
   Duration  40.23s
```

### Coverage Highlights:
- **`tests/validation.test.js` (56 tests):** Validates email RFC compliance, password complexity, boundary lengths, text sanitization, and controlled enums.
- **`tests/auth.test.js` (21 tests):** Tests local registration, login, logout, password hashing, and OAuth route registration.
- **`tests/feedback.test.js` (20 tests):** Tests feedback submission, reference number generation, ownership scoping (IDOR defense), anonymous masking, and administrative status transitions.
- **`tests/attachment.test.js` (11 tests):** Tests 5 MB file size enforcement, magic-byte inspection, corrupt file rejection, Sharp buffer normalization, and route access guards.
- **`tests/chat.test.js` (18 tests):** Tests Gemini input boundaries, API key non-disclosure, rate limiting, and escalation workflows.

---

## 10. Security & Privacy Verification Review

| Security Mechanism | Implementation Status | Verification Evidence |
|---|:---:|---|
| **SQL Injection Defense** | **VERIFIED PASS** | 100% of SQL queries in all `models/*.js` use parameterized `?` placeholders. Zero raw SQL string concatenations. |
| **Cross-Site Scripting (XSS)** | **VERIFIED PASS** | All EJS templates use `<%= %>` for dynamic content. `<%- %>` is strictly restricted to trusted internal HTML partial includes. |
| **IDOR Prevention** | **VERIFIED PASS** | All student read operations execute `WHERE id = ? AND user_id = ?`. Access to another user's record returns `404 Not Found`. |
| **Anonymous Privacy** | **VERIFIED PASS** | Identity masked in administrative queries via SQL `CASE WHEN`. Sharp strips EXIF, camera, and GPS metadata from attachments. |
| **Password Security** | **VERIFIED PASS** | Hashes generated via `bcrypt` with cost factor 12. Plaintext passwords never stored or logged. |
| **Session Hardening** | **VERIFIED PASS** | `HttpOnly`, `SameSite=Lax`, and conditional `Secure` flags enforced. `req.session.regenerate()` on login. |
| **Helmet Security Headers** | **VERIFIED PASS** | Helmet mounted in `app.js` with Content-Security-Policy (CSP) restricting scripts, fonts, and styles. |
| **CSRF Defense** | **PARTIAL** | Cookie `SameSite=Lax` active. Logout requires POST. Explicit CSRF token validation (`csrf-csrf`) installed but not mounted in `app.js`. |
| **OAuth Domain Restriction** | **NOT ACTIVE** | `config/passport.js` allows any valid Google account. Domain restriction to `@cspc.edu.ph` is not currently enforced. |

---

## 11. Corrections to Earlier Documentation (Audit Errata)

In the spirit of complete academic transparency, the following corrections are made to earlier entries and project documentation:

1. **Google OAuth Domain Restriction:**
   - *Previous Claim (Entry 002 & README):* Stated that Google OAuth strictly enforces institutional domain restriction to `@cspc.edu.ph`.
   - *Correction / Reality:* The current implementation in [`config/passport.js:L9`](file:///c:/Users/Sam/Desktop/EMERGING%20TECH/config/passport.js#L9) does not filter by domain (`"Any Google account can sign in. No domain restriction."`). This was relaxed during development to permit testing with personal Google accounts.
2. **CSRF Middleware Implementation:**
   - *Previous Claim (Entry 001 & DEF-003):* Stated that deprecated `csurf` was uninstalled and replaced by `csrf-csrf`.
   - *Correction / Reality:* While `csrf-csrf` was added to `package.json`, its middleware was never mounted in `app.js`, and form templates do not contain `_csrf` hidden tokens. The application currently relies on `SameSite=Lax` session cookies and POST-only state changes for CSRF mitigation.
3. **Recent Feature Coverage:**
   - *Previous Deficiency:* The log previously terminated at Entry 003 (September 27). Entries 004, 005, 006, and 007 have now been added to comprehensively document the anonymous privacy rewrite, Aizen AI model fallbacks, Cloudinary persistent storage migration, and automated attachment testing.

---

## 12. Limitations, Technical Debt & Outstanding Issues

1. **Multi-Member GitHub Collaboration (Academic Compliance):**
   - *Status:* Critical Academic Blocker.
   - *Issue:* Git history currently reflects commits from only 1 member (`Sam`). No Pull Requests or code review approvals exist on the GitHub remote.
   - *Plan:* Team members must create feature branches, submit Pull Requests, perform peer code reviews, and merge changes prior to the final midterm showcase.
2. **CSRF Token Activation:**
   - *Status:* Planned for Round 2.
   - *Issue:* Activate `csrf-csrf` middleware across all forms to supplement existing `SameSite=Lax` defenses.
3. **Institutional Domain Enforcement:**
   - *Status:* Planned for Round 2.
   - *Issue:* Re-enable `@cspc.edu.ph` domain filtering in `config/passport.js` prior to live campus rollout.

---

## 13. Final Reflection on AI-Assisted Development

Utilizing AI as a development assistant provided immense educational and technical acceleration throughout this project. It enabled the implementation of production-grade patterns (atomic transactions, memory-streamed cloud storage, dynamic model fallbacks) that go beyond standard classroom assignments.

Crucially, this experience demonstrated that **AI suggestions cannot be blindly trusted**. Real-world engineering requires rigorous developer oversight:
- The initial AI-generated anonymous logic would have broken student tracking had it not been caught and redesigned.
- The initial AI test suites encountered CommonJS/ESM module loader conflicts that required manual debugging.
- Configuration bugs (such as Cloudinary cloud name syntax) required manual investigation of runtime logs.

By combining AI-driven code acceleration with strict manual review, comprehensive test suites, and transparent academic disclosure, the CSPC Suggestion & Feedback System stands as a robust, secure, and verifiable software engineering achievement.
