# Defect Log

> **CSPC Suggestion & Feedback System**  
> CCIT 106 — Application Development and Emerging Technologies

---

## Defect Summary

| ID | Severity | Status | Description |
|---|---|---|---|
| DEF-001 | Low | Fixed | Validation test used incorrect boundary value for email max-length |
| DEF-002 | Low | Fixed | `vitest.config.js` ESM syntax caused Vite warning when loaded as CJS |
| DEF-003 | Medium | Fixed | `csurf` package deprecated/archived — replaced with `csrf-csrf` |

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
| **Fix** | Uninstalled `csurf`, installed `csrf-csrf` (actively maintained replacement). |
| **Evidence** | `npm install` shows 0 vulnerabilities after replacement. |

---

*New defects found during testing must be logged here before the final submission.*
