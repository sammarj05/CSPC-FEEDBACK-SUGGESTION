# Defect Log

> **CSPC Suggestion & Feedback System**  
> CCIT 106 — Application Development and Emerging Technologies

---

## Defect Summary

| ID | Severity | Status | Description |
|---|---|---|---|
| DEF-001 | Low | Fixed | Validation test used incorrect boundary value for email max-length |
| DEF-002 | Low | Fixed | `vitest.config.js` ESM syntax caused Vite warning when loaded as CJS |
| DEF-003 | Medium | Fixed | `csurf` package deprecated/archived — replaced dependency with `csrf-csrf` |
| DEF-004 | High | Fixed | Session cookie dropped on Render due to reverse proxy terminating HTTPS |
| DEF-005 | Medium | Fixed | Cloudinary upload failed due to literal string "image" configured in CLOUDINARY_CLOUD_NAME |

---

## DEF-001

| Field | Detail |
|---|---|
| **Defect ID** | DEF-001 |
| **Description** | `validateEmail()` test for max-length exceeded used 250 + "@x.ph" = 255 chars total, which is exactly at the limit (valid), not above it. Test incorrectly expected `false` but got `true`. |
| **Steps to Reproduce** | Run `npx vitest run tests/validation.test.js`. Observe failure in `validateEmail() > fails when exceeding 255 characters`. |
| **Expected Result** | Test should create a 256-character email and expect `valid = false`. |
| **Actual Result** | A 255-character email was created — exactly at the boundary — so `valid = true` was returned. |
| **Severity** | Low (test bug, not application bug) |
| **Priority** | Low |
| **Status** | Fixed |
| **Fix** | Changed test email to `"a".repeat(251) + "@x.ph"` = 256 chars total. |
| **Evidence** | Vitest output: 56/56 tests passing after fix. |

---

## DEF-002

| Field | Detail |
|---|---|
| **Defect ID** | DEF-002 |
| **Description** | `vitest.config.js` used ESM `import/export` syntax but was loaded as CommonJS by Vite's config loader, causing a warning on every test run. |
| **Steps to Reproduce** | Run any Vitest command — warning printed: "ESM syntax in a file loaded as CommonJS". |
| **Expected Result** | No warnings during test runs. |
| **Actual Result** | Warning printed but tests still run. |
| **Severity** | Low (warning only, does not affect test results) |
| **Priority** | Low |
| **Status** | Fixed |
| **Fix** | Renamed `vitest.config.js` → `vitest.config.mjs` so Node.js loads it as ESM. |
| **Evidence** | No warning in subsequent test runs. |

---

## DEF-003

| Field | Detail |
|---|---|
| **Defect ID** | DEF-003 |
| **Description** | `csurf` package is archived and no longer maintained. npm install prints a deprecation warning. |
| **Steps to Reproduce** | Run `npm install csurf` — deprecation warning displayed. |
| **Expected Result** | No deprecated packages in production dependencies. |
| **Actual Result** | Deprecated package installed with npm warning. |
| **Severity** | Medium (security risk — no future patches for vulnerabilities) |
| **Priority** | Medium |
| **Status** | Fixed |
| **Fix** | Uninstalled `csurf`, installed `csrf-csrf` (actively maintained replacement). Note: explicit token middleware integration deferred to Round 2; session cookies use `SameSite=Lax`. |
| **Evidence** | `npm install` shows 0 vulnerabilities after replacement. |

---

## DEF-004

| Field | Detail |
|---|---|
| **Defect ID** | DEF-004 |
| **Description** | Users were repeatedly redirected back to the login screen on Render production despite entering valid credentials. |
| **Steps to Reproduce** | Log into the live deployed site at `https://cspcfeedbacksuggest.me`. Browser drops session cookie on the subsequent redirect. |
| **Expected Result** | Session cookie is accepted and stored by the browser; user is redirected to dashboard. |
| **Actual Result** | Express dropped `secure: true` session cookie because internal request from reverse proxy arrived as HTTP. |
| **Severity** | High (broke authentication in production) |
| **Priority** | High |
| **Status** | Fixed |
| **Fix** | Added `app.set("trust proxy", 1);` in `app.js` when running in `NODE_ENV === "production"`. |
| **Evidence** | Verified in live browser: `connect.sid` cookie retained with `HttpOnly; Secure; SameSite=Lax`. |

---

## DEF-005

| Field | Detail |
|---|---|
| **Defect ID** | DEF-005 |
| **Description** | Feedback submission with image attachment failed with server error: `Invalid cloud_name image`. |
| **Steps to Reproduce** | Set `CLOUDINARY_CLOUD_NAME=image` in `.env`, run server, and submit feedback with a photo attachment. |
| **Expected Result** | Image uploaded successfully to Cloudinary cloud account. |
| **Actual Result** | Cloudinary SDK threw 400 Bad Request error `Invalid cloud_name image`. |
| **Severity** | Medium (broke image upload pipeline) |
| **Priority** | High |
| **Status** | Fixed |
| **Fix** | Corrected `.env` to use the actual unique Cloudinary account cloud name / `CLOUDINARY_URL`. |
| **Evidence** | Uploaded feedback attachment successfully; image confirmed in Cloudinary media library and rendered in app. |

---

*New defects found during testing must be logged here before the final submission.*

