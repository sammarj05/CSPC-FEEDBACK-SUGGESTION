# CSPC Suggestion & Feedback System

> A professional, dynamic, database-driven web application for **Camarines Sur Polytechnic Colleges** (CSPC) that allows students to submit suggestions, complaints, concerns, and feedback to authorized CSPC personnel.

---

## Project Description

The **CSPC Suggestion & Feedback System** is a full-stack Node.js web application built as a semester project for **CCIT 106 — Application Development and Emerging Technologies**. It provides CSPC students with a structured, trackable way to communicate feedback to the institution, and gives authorized administrators the tools to review, respond to, and manage that feedback.

---

## Purpose

- Give every CSPC student a voice.
- Provide transparent status tracking for submitted feedback.
- Enable CSPC administrators to efficiently manage and respond to student concerns.
- Demonstrate real-world full-stack development skills learned in CCIT 106.

---

## Features

| Feature | Details |
|---|---|
| Student Registration & Login | Manual email/password or **Login with CSPC Email** (Google OAuth, domain-restricted to `cspc.edu.ph`) |
| Feedback Submission | Types: Suggestion, Complaint, Concern, General Feedback, Appreciation |
| Unique Reference Numbers | Format: `FB-YYYY-#####`, generated dynamically |
| Status Tracking | Submitted → Under Review → In Progress → Resolved → Closed |
| Status Timeline | Chronological history of every status change |
| Anonymous Submission | Student identity hidden from admin view |
| Admin Dashboard | Real-time stats: counts by status, category, type |
| Admin Feedback Management | Search, filter by status/category/type/priority, paginate |
| Admin Responses | Official responses appear on student's feedback detail page |
| Security | bcrypt passwords, session management, Helmet headers, rate limiting, server-side authorization |
| Accessible UI | Semantic HTML, ARIA labels, keyboard navigation, responsive design |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (LTS) |
| Web Framework | Express.js |
| View Engine | EJS |
| Database | MySQL |
| Authentication | express-session + bcrypt + Passport.js (Google OAuth 2.0) |
| Security | Helmet, express-rate-limit |
| Logging | Morgan (HTTP) + custom structured logger |
| Testing | Vitest + SuperTest |
| Version Control | Git / GitHub |

---

## System Architecture

```
Browser
  ↓ HTTPS
Express.js (app.js)
  ↓ Middleware: logger → body parser → session → Passport → Helmet → flash
Routes (authRoutes / feedbackRoutes / adminRoutes)
  ↓
Controllers (authController / feedbackController / adminController)
  ↓
Models (userModel / feedbackModel / categoryModel / responseModel)
  ↓ Parameterized queries
MySQL Database (cspc_feedback_db)
  ↓
EJS (server-side rendering)
  ↓
Browser
```

**app.js** — Configures Express, registers middleware and routes, exports the app (no `listen()`).  
**server.js** — Imports app.js and calls `app.listen()`. Kept separate for clean test isolation.

---

## Database

**Tables:**

| Table | Purpose |
|---|---|
| `users` | Student and admin accounts |
| `categories` | Feedback categories (database-driven) |
| `feedback` | All submitted feedback records |
| `feedback_status_history` | Audit trail of every status change |
| `feedback_responses` | Administrator responses to feedback |

---

## Installation

### Prerequisites

- Node.js 18+ LTS
- MySQL 8.0+
- A Google Cloud project with OAuth 2.0 credentials (for CSPC Email login)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/cspc-feedback-system.git
cd cspc-feedback-system

# 2. Install dependencies
npm ci

# 3. Copy environment file and fill in values
cp .env.example .env
# Edit .env with your database credentials and secrets

# 4. Apply the database schema
mysql -u root -p < schema.sql

# 5. Seed initial data (categories + default admin)
mysql -u root -p < seed.sql

# 6. Start development server
npm run dev
```

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port (default: 3306) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (`cspc_feedback_db`) |
| `SESSION_SECRET` | Long random string for session signing |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL |
| `CSPC_EMAIL_DOMAIN` | Allowed email domain (e.g. `cspc.edu.ph`) |
| `NODE_ENV` | `development` or `production` |

---

## Database Setup

```bash
# Apply schema
mysql -u root -p < schema.sql

# Seed data
mysql -u root -p < seed.sql
```

**Default admin account** (created by seed.sql):
- Email: `admin@cspc.edu.ph`
- Password: `Admin@CSPC2026`
- ⚠️ **Change this password immediately after first login.**

---

## Development

```bash
npm run dev        # Start with nodemon (auto-restart on changes)
npm start          # Production start
npm test           # Run all tests
npm run test:watch # Watch mode
npm run test:coverage  # Coverage report
```

---

## Testing

```bash
# Unit tests only (no DB required)
npx vitest run tests/validation.test.js

# All tests
npm test
```

**Test coverage:**
- `tests/validation.test.js` — 56 unit tests for all validation functions
- `tests/auth.test.js` — SuperTest integration tests for auth routes
- `tests/feedback.test.js` — SuperTest integration tests for feedback and admin routes

---

## Routes

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Home page |
| GET | `/auth/register` | Public | Registration form |
| POST | `/auth/register` | Public | Create account |
| GET | `/auth/login` | Public | Login form |
| POST | `/auth/login` | Public | Authenticate |
| GET | `/auth/google` | Public | Start Google OAuth |
| GET | `/auth/google/callback` | Public | OAuth callback |
| POST | `/auth/logout` | Auth | Destroy session |
| GET | `/student/dashboard` | Student | Student dashboard |
| GET | `/feedback/new` | Auth | Feedback form |
| POST | `/feedback` | Auth | Submit feedback |
| GET | `/feedback` | Auth | My submissions |
| GET | `/feedback/:id` | Auth | Feedback detail |
| GET | `/admin/dashboard` | Admin | Admin dashboard |
| GET | `/admin/feedback` | Admin | Manage feedback |
| GET | `/admin/feedback/:id` | Admin | Feedback detail |
| POST | `/admin/feedback/:id/status` | Admin | Update status |
| POST | `/admin/feedback/:id/respond` | Admin | Add response |

---

## User Roles

| Role | Access |
|---|---|
| `student` | Submit feedback, view own submissions, track status, view admin responses |
| `admin` | View all feedback, search/filter, change status, respond, view stats |

Roles are stored in the database. Role checks are enforced **server-side** in middleware — hiding links in the UI is not sufficient.

---

## Security

- **Passwords**: Hashed with bcrypt (cost factor 12). Never stored in plaintext.
- **SQL Injection**: All queries use parameterized statements (`?` placeholders).
- **XSS**: All user output uses escaped EJS (`<%= %>`) — never `<%- %>` for user content.
- **Session**: `httpOnly`, `sameSite: lax`, `secure: true` in production.
- **Authorization**: `requireLogin` + `requireRole` middleware on every protected route.
- **Ownership**: Student feedback queries include `WHERE user_id = ?` — no cross-account access.
- **Rate Limiting**: Login, register, and feedback submission endpoints rate-limited.
- **Security Headers**: Helmet with Content Security Policy.
- **OAuth Domain Restriction**: Only `cspc.edu.ph` Google accounts accepted.

---

## Accessibility

- Semantic HTML5 elements (`<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`)
- ARIA labels and roles on interactive elements
- Keyboard navigation and visible focus indicators
- Status badges use text labels, not color alone
- Form errors announced via `role="alert"` and `aria-live`
- Responsive layout for desktop, tablet, and mobile

---

## Known Issues

See [`DEFECT-LOG.md`](DEFECT-LOG.md) for the full defect log.

---

## AI-Assisted Development Disclosure

This project was developed with AI assistance. See [`AI-ASSISTED-DEVELOPMENT-LOG.md`](AI-ASSISTED-DEVELOPMENT-LOG.md) for the complete log of AI-assisted tasks, what was produced, what was changed, and how it was verified.

---

## License

MIT License — see [`LICENSE`](LICENSE).

---

## Live Application

> Deployment in progress. URL will be updated here once the system is live.

`https://YOUR-DOMAIN-HERE`
