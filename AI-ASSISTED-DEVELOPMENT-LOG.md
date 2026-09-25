# AI-Assisted Development Log

> **CSPC Suggestion & Feedback System**  
> CCIT 106 — Application Development and Emerging Technologies  
> Camarines Sur Polytechnic Colleges

This log documents every significant AI-assisted task during development, as required by the project specification. The developer remains fully responsible for all code in this repository.

---

## Log Entries

---

### Entry 001

| Field | Detail |
|---|---|
| **Date** | 2026-09-25 |
| **Task** | Full project scaffold — Phase 1 to Phase 11 |
| **AI Tool** | Google Antigravity (Claude Sonnet 4.6 Thinking) |
| **What it produced** | Complete project structure: `app.js`, `server.js`, all models, controllers, routes, middleware, EJS views, CSS stylesheets, SQL schema, seed data, test files, README, LICENSE, AI log, defect log |
| **What we changed** | Removed deprecated `csurf` package and replaced with `csrf-csrf`. Added `google_id` column to schema after OAuth feature was added. Fixed `validateEmail()` boundary test: the original test used 250+5=255 chars which is exactly the limit (valid), corrected to 251+5=256 chars (invalid). Renamed `vitest.config.js` to `vitest.config.mjs` to eliminate Vite ESM warning. |
| **Why we changed it** | `csurf` is archived and no longer maintained. The schema needed `google_id` to support the "Login with CSPC Email" OAuth feature requested during development. The test boundary was genuinely wrong — found by running the tests and reading the failure output. |
| **How we verified it** | Ran `npx vitest run tests/validation.test.js` — 56/56 tests passed after fix. Reviewed all generated files manually for correctness, parameterized queries, escaped EJS output, and role enforcement logic. |

---

### Entry 002

| Field | Detail |
|---|---|
| **Date** | 2026-09-25 |
| **Task** | "Login with CSPC Email" Google OAuth feature |
| **AI Tool** | Google Antigravity (Claude Sonnet 4.6 Thinking) |
| **What it produced** | `config/passport.js` with Google OAuth 2.0 strategy, domain restriction to `cspc.edu.ph`, auto-provisioning of student accounts on first login. Updated `authRoutes.js` with `/auth/google` and `/auth/google/callback`. Updated login and register EJS views with styled Google button and divider. Added `btn--google`, `oauth-section`, `auth-divider` CSS classes. Updated `.env.example` with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `CSPC_EMAIL_DOMAIN` variables. |
| **What we changed** | Verified that role is always taken from the database, never from the Google profile. Confirmed that the domain restriction is enforced server-side in the Passport strategy callback, not just via the `hd` hint (which is only a UX hint to Google's account picker). Added a note in the view that "internal records are retained" to avoid false anonymity promises. |
| **Why we changed it** | Security review: the `hd` parameter only pre-filters Google's account picker UI — it does NOT prevent a non-CSPC account from completing the OAuth flow. Server-side domain enforcement in the strategy callback is mandatory. |
| **How we verified it** | Code review of `config/passport.js` — confirmed the `emailDomain !== CSPC_EMAIL_DOMAIN` check rejects before any database access. Confirmed `req.session.user.role` is always sourced from the database row, never from `profile.role` (which Google doesn't even provide). |

---

## AI Verification Checklist

For every AI-generated file, the following was verified:

- [x] Parameterized SQL queries only (no string concatenation)
- [x] Escaped EJS output (`<%= %>`) for all user content
- [x] Server-side validation on all form submissions
- [x] Role checks from session/database, never from client
- [x] Ownership-scoped queries include `WHERE user_id = ?`
- [x] No secrets in source code or views
- [x] No stack traces exposed in production error responses
- [x] Passwords hashed with bcrypt before storage
- [x] Session regenerated after login
- [x] Logout via POST, not GET
- [x] All AI-generated code tested before committing

---

*This log must be updated for every future AI-assisted task.*
