# CSPC Suggestion & Feedback System

> A professional, dynamic, database-driven web application for **Camarines Sur Polytechnic Colleges** (CSPC) that allows students to submit suggestions, complaints, concerns, and feedback to authorized CSPC personnel.

---

## Project Description

The **CSPC Suggestion & Feedback System** is a full-stack Node.js web application built as a semester project for **CCIT 106 â€” Application Development and Emerging Technologies**. It provides CSPC students with a structured, trackable way to communicate feedback to the institution, and gives authorized administrators the tools to review, respond to, and manage that feedback.

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
| Status Tracking | Submitted â†’ Under Review â†’ In Progress â†’ Resolved â†’ Closed |
| Status Timeline | Chronological history of every status change |
| Anonymous Submission | Student identity hidden from admin view |
| Admin Dashboard | Real-time stats: counts by status, category, type |
| Admin Feedback Management | Search, filter by status/category/type/priority, paginate |
| Admin Responses | Official responses appear on student's feedback detail page |
| Security | bcrypt passwords, session management, Helmet headers, rate limiting, server-side authorization |
| Aizen AI Chatbot | Floating AI assistant powered by Google Gemini; feedback status lookup; admin escalation |
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
  â†“ HTTPS
Express.js (app.js)
  â†“ Middleware: logger â†’ body parser â†’ session â†’ Passport â†’ Helmet â†’ flash
Routes (authRoutes / feedbackRoutes / adminRoutes)
  â†“
Controllers (authController / feedbackController / adminController)
  â†“
Models (userModel / feedbackModel / categoryModel / responseModel)
  â†“ Parameterized queries
MySQL Database (cspc_feedback_db)
  â†“
EJS (server-side rendering)
  â†“
Browser
```

**app.js** â€” Configures Express, registers middleware and routes, exports the app (no `listen()`).  
**server.js** â€” Imports app.js and calls `app.listen()`. Kept separate for clean test isolation.

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
| `chat_conversations` | Aizen AI chat sessions (one per conversation) |
| `chat_messages` | Individual messages in each chat session |

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
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for private image attachments |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (server-side only) |
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
- âš ï¸ **Change this password immediately after first login.**

### Existing databases: image attachment migration

Do not re-run `schema.sql` against a deployed database. Before deploying image attachments, back up the hosted database and run this non-destructive migration once:

```bash
mysql -u <user> -p <database> < migrations/20260930_add_feedback_image_attachments.sql
```

Set the three `CLOUDINARY_*` variables in Render's Environment settings. Attachments are stored as private Cloudinary assets, rather than Render's ephemeral filesystem. Existing feedback remains valid because both new columns are nullable.

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
- `tests/validation.test.js` â€” 56 unit tests for all validation functions
- `tests/auth.test.js` â€” SuperTest integration tests for auth routes
- `tests/feedback.test.js` â€” SuperTest integration tests for feedback and admin routes

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
| GET | `/feedback/:id/image` | Owner | View own attached image |
| GET | `/feedback/:id` | Auth | Feedback detail |
| GET | `/admin/dashboard` | Admin | Admin dashboard |
| GET | `/admin/feedback` | Admin | Manage feedback |
| GET | `/admin/feedback/:id/image` | Admin | View attached image |
| GET | `/admin/feedback/:id` | Admin | Feedback detail |
| POST | `/admin/feedback/:id/status` | Admin | Update status |
| POST | `/admin/feedback/:id/respond` | Admin | Add response |
| POST | `/api/chat` | Public | Send message to Aizen AI |
| POST | `/api/chat/escalate` | Public | Escalate to human admin |
| GET | `/admin/chat` | Admin | View all chat conversations |
| GET | `/admin/chat/:id` | Admin | View single conversation |
| POST | `/admin/chat/:id/reply` | Admin | Admin reply to user |

---

## User Roles

| Role | Access |
|---|---|
| `student` | Submit feedback, view own submissions, track status, view admin responses |
| `admin` | View all feedback, search/filter, change status, respond, view stats |

Roles are stored in the database. Role checks are enforced **server-side** in middleware â€” hiding links in the UI is not sufficient.

---

## Security

- **Passwords**: Hashed with bcrypt (cost factor 12). Never stored in plaintext.
- **SQL Injection**: All queries use parameterized statements (`?` placeholders).
- **XSS**: All user output uses escaped EJS (`<%= %>`) â€” never `<%- %>` for user content.
- **Session**: `httpOnly`, `sameSite: lax`, `secure: true` in production.
- **Authorization**: `requireLogin` + `requireRole` middleware on every protected route.
- **Ownership**: Student feedback queries include `WHERE user_id = ?` â€” no cross-account access.
- **Rate Limiting**: Login, register, and feedback submission endpoints rate-limited.
- **Attachments**: Images are limited to 5 MB, decoded and re-encoded with Sharp, stored as private Cloudinary assets, and streamed only after owner/admin authorization.
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

---

## Aizen AI — AI Chatbot Feature

Aizen AI is the AI-powered assistant for the CSPC Feedback System, built on **Google Gemini**.

### How it works

`
User (browser)
  ↓  POST /api/chat  (our Express server — no API key in browser)
Express backend (chatController.js)
  ↓  @google/generative-ai SDK
Gemini API
  ↓
Express backend
  ↓
Browser (chat widget)
`

### Setup

1. Obtain a Gemini API key from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

2. Add it to your local .env:
   `
   GEMINI_API_KEY=your_key_here
   `

3. Apply the chat database schema:
   `ash
   mysql -u root -p < chat-schema.sql
   `

4. Restart the server — the 🤖 **Aizen AI** button will appear on every page.

### Running Aizen AI locally

`ash
npm run dev
# Open http://localhost:3000 — click the Aizen AI button (bottom-right)
`

### Security model

| Concern | How it is handled |
|---|---|
| API key exposure | Key lives only in `.env` and is used server-side only; never sent to the browser |
| IDOR | Conversation ownership verified from `req.session` (never from `req.body`) |
| Input length | Max 1 000 characters; rejected with 400 before reaching Gemini |
| Rate limiting | 20 messages / 10 minutes per IP |
| SQL injection | All DB queries use parameterized `?` placeholders |
| Arbitrary SQL | Gemini never has DB access; all DB calls go through controlled helper functions |
| Anonymous identity | System prompt + context explicitly forbid revealing anonymous submitter identity |
| Prompt injection | Gemini never executes commands or generates SQL |
| Error handling | Gemini errors return a friendly message; stack traces and credentials never exposed |

### AI limitations

- Aizen AI can only answer questions about the CSPC Feedback System.
- It cannot change feedback status, delete feedback, or perform any database writes.
- It will not invent school policies or administrative decisions.
- If it cannot answer, it recommends contacting an administrator.
- **It is not a human administrator.** It clearly identifies itself as Aizen AI.

### Administrator escalation

Users can click **"Talk to an Admin"** at any time. This:
1. Marks the conversation as escalated in chat_conversations.
2. Adds a system message to the conversation.
3. Makes the conversation visible to admins at /admin/chat.

Admins can view all conversations at /admin/chat and reply directly to users. Admin messages are clearly labeled **"Administrator"** — never confused with Aizen AI messages.

## Known Issues

See [`DEFECT-LOG.md`](DEFECT-LOG.md) for the full defect log.

---

## AI-Assisted Development Disclosure

This project was developed with AI assistance. See [`AI-ASSISTED-DEVELOPMENT-LOG.md`](AI-ASSISTED-DEVELOPMENT-LOG.md) for the complete log of AI-assisted tasks, what was produced, what was changed, and how it was verified.

---

## License

MIT License â€” see [`LICENSE`](LICENSE).

---

## Live Application

> Deployment in progress. URL will be updated here once the system is live.

`https://YOUR-DOMAIN-HERE`

