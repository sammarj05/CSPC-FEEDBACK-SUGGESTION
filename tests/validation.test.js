import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  validateRegistration,
  validateLogin,
  validateFeedbackSubmission,
  validateAdminResponse,
  validateCommunityComment,
  validateStatusChange,
  validateText,
  validateEnum,
  sanitize,
  VALID_FEEDBACK_TYPES,
  VALID_PRIORITIES,
  VALID_STATUSES,
} from "../lib/validation.js";

// =============================================================
// sanitize()
// =============================================================
describe("sanitize()", () => {
  it("trims leading whitespace", () => {
    expect(sanitize("  hello")).toBe("hello");
  });
  it("trims trailing whitespace", () => {
    expect(sanitize("hello  ")).toBe("hello");
  });
  it("returns empty string for non-string input", () => {
    expect(sanitize(null)).toBe("");
    expect(sanitize(undefined)).toBe("");
    expect(sanitize(123)).toBe("");
  });
});

describe("validateText()", () => {
  it("passes for valid text within bounds", () => {
    expect(validateText("Hello World", "Field", 1, 255).valid).toBe(true);
  });
  it("fails for empty string", () => {
    expect(validateText("", "Field", 1, 255).valid).toBe(false);
  });
  it("fails for whitespace-only input", () => {
    expect(validateText("   ", "Field", 1, 255).valid).toBe(false);
  });
  it("fails when below minimum length", () => {
    const r = validateText("ab", "Field", 5, 255);
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/at least 5/);
  });
  it("fails when exceeding maximum length", () => {
    const r = validateText("a".repeat(256), "Field", 1, 255);
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/not exceed 255/);
  });
  it("passes at exactly minimum length", () => {
    expect(validateText("ab", "Field", 2, 255).valid).toBe(true);
  });
  it("fails at maximum + 1", () => {
    expect(validateText("a".repeat(256), "Field", 1, 255).valid).toBe(false);
  });
  it("supports names with ñ character", () => {
    expect(validateText("Niño", "Name", 1, 100).valid).toBe(true);
  });
  it("supports names with apostrophes (O'Brien)", () => {
    expect(validateText("O'Brien", "Name", 1, 100).valid).toBe(true);
  });
  it("supports hyphenated names", () => {
    expect(validateText("Garcia-Lopez", "Name", 1, 100).valid).toBe(true);
  });
});

describe("validateEmail()", () => {
  it("passes for a valid CSPC email", () => {
    expect(validateEmail("student@cspc.edu.ph").valid).toBe(true);
  });
  it("passes for standard email format", () => {
    expect(validateEmail("juan.dela.cruz@gmail.com").valid).toBe(true);
  });
  it("fails for empty input", () => {
    expect(validateEmail("").valid).toBe(false);
  });
  it("fails when missing @", () => {
    expect(validateEmail("notanemail").valid).toBe(false);
  });
  it("fails when missing domain", () => {
    expect(validateEmail("user@").valid).toBe(false);
  });
  it("fails when exceeding 255 characters", () => {
    // Build an email that is exactly 256 chars total
    const longEmail = "a".repeat(251) + "@x.ph"; // 251 + 4 = 256 chars
    expect(validateEmail(longEmail).valid).toBe(false);
  });

});

describe("validatePassword()", () => {
  it("passes for a valid password", () => {
    expect(validatePassword("Student123").valid).toBe(true);
  });
  it("fails for empty password", () => {
    expect(validatePassword("").valid).toBe(false);
  });
  it("fails for password under 8 characters", () => {
    expect(validatePassword("Pass1").valid).toBe(false);
  });
  it("fails when no letters present", () => {
    expect(validatePassword("12345678").valid).toBe(false);
  });
  it("fails when no digits present", () => {
    expect(validatePassword("Password").valid).toBe(false);
  });
  it("passes at exactly 8 characters", () => {
    expect(validatePassword("Pass1234").valid).toBe(true);
  });
  it("fails when exceeding 128 characters", () => {
    expect(validatePassword("Aa1" + "x".repeat(126)).valid).toBe(false);
  });
});

describe("validateRegistration()", () => {
  const validData = {
    name: "Juan dela Cruz",
    email: "juan@cspc.edu.ph",
    password: "Secure123",
    confirmPassword: "Secure123",
    studentId: "2023-00001",
    department: "BS IT",
  };
  it("passes for valid registration data", () => {
    expect(validateRegistration(validData).valid).toBe(true);
  });
  it("fails when passwords do not match", () => {
    const r = validateRegistration({ ...validData, confirmPassword: "Different1" });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes("do not match"))).toBe(true);
  });
  it("fails when name is empty", () => {
    expect(validateRegistration({ ...validData, name: "" }).valid).toBe(false);
  });
  it("fails for invalid email", () => {
    expect(validateRegistration({ ...validData, email: "not-an-email" }).valid).toBe(false);
  });
  it("fails for weak password", () => {
    expect(validateRegistration({ ...validData, password: "weak", confirmPassword: "weak" }).valid).toBe(false);
  });
});

describe("validateLogin()", () => {
  it("passes when both fields are present", () => {
    expect(validateLogin({ email: "user@example.com", password: "secret" }).valid).toBe(true);
  });
  it("fails when email is empty", () => {
    expect(validateLogin({ email: "", password: "secret" }).valid).toBe(false);
  });
  it("fails when password is empty", () => {
    expect(validateLogin({ email: "user@example.com", password: "" }).valid).toBe(false);
  });
});

describe("validateFeedbackSubmission()", () => {
  const validFeedback = {
    type: "suggestion",
    categoryId: "1",
    priority: "medium",
    subject: "Improve library hours",
    description: "The library should be open until 8PM on weekdays for studying.",
  };
  it("passes for valid feedback", () => {
    expect(validateFeedbackSubmission(validFeedback).valid).toBe(true);
  });
  it("fails for invalid feedback type", () => {
    expect(validateFeedbackSubmission({ ...validFeedback, type: "insult" }).valid).toBe(false);
  });
  it("fails for invalid priority", () => {
    expect(validateFeedbackSubmission({ ...validFeedback, priority: "critical" }).valid).toBe(false);
  });
  it("fails for categoryId of zero", () => {
    expect(validateFeedbackSubmission({ ...validFeedback, categoryId: "0" }).valid).toBe(false);
  });
  it("fails for non-numeric categoryId", () => {
    expect(validateFeedbackSubmission({ ...validFeedback, categoryId: "abc" }).valid).toBe(false);
  });
  it("fails for empty subject", () => {
    expect(validateFeedbackSubmission({ ...validFeedback, subject: "" }).valid).toBe(false);
  });
  it("fails when subject < 5 chars", () => {
    expect(validateFeedbackSubmission({ ...validFeedback, subject: "Hi" }).valid).toBe(false);
  });
  it("fails for empty description", () => {
    expect(validateFeedbackSubmission({ ...validFeedback, description: "" }).valid).toBe(false);
  });
  it("fails when description < 10 chars", () => {
    expect(validateFeedbackSubmission({ ...validFeedback, description: "Short" }).valid).toBe(false);
  });
  it("fails when subject exceeds 255 chars", () => {
    expect(validateFeedbackSubmission({ ...validFeedback, subject: "a".repeat(256) }).valid).toBe(false);
  });
  it("passes for all valid feedback types", () => {
    VALID_FEEDBACK_TYPES.forEach(type => {
      expect(validateFeedbackSubmission({ ...validFeedback, type }).valid).toBe(true);
    });
  });
  it("passes for all valid priorities", () => {
    VALID_PRIORITIES.forEach(priority => {
      expect(validateFeedbackSubmission({ ...validFeedback, priority }).valid).toBe(true);
    });
  });
  it("handles special characters in subject", () => {
    expect(validateFeedbackSubmission({ ...validFeedback, subject: "Room #301 — A/C broken" }).valid).toBe(true);
  });
});

describe("validateAdminResponse()", () => {
  it("passes for valid message", () => {
    expect(validateAdminResponse({ message: "Thank you for your feedback. We will address this." }).valid).toBe(true);
  });
  it("fails for empty message", () => {
    expect(validateAdminResponse({ message: "" }).valid).toBe(false);
  });
  it("fails for message below 10 chars", () => {
    expect(validateAdminResponse({ message: "Ok noted" }).valid).toBe(false);
  });
  it("fails for message exceeding 5000 chars", () => {
    expect(validateAdminResponse({ message: "x".repeat(5001) }).valid).toBe(false);
  });
});

describe("validateCommunityComment()", () => {
  it("passes for a constructive comment", () => {
    expect(validateCommunityComment({ commentText: "I experience this issue as well." }).valid).toBe(true);
  });
  it("rejects an empty or whitespace-only comment", () => {
    expect(validateCommunityComment({ commentText: "   " }).valid).toBe(false);
  });
  it("rejects comments over 500 characters", () => {
    expect(validateCommunityComment({ commentText: "x".repeat(501) }).valid).toBe(false);
  });
  it("allows text that EJS will render as escaped content", () => {
    expect(validateCommunityComment({ commentText: "<script>alert('xss')</script>" }).valid).toBe(true);
  });
});

describe("validateStatusChange()", () => {
  it("passes for all valid statuses", () => {
    VALID_STATUSES.forEach(status => {
      expect(validateStatusChange({ status }).valid).toBe(true);
    });
  });
  it("fails for invalid status", () => {
    expect(validateStatusChange({ status: "pending" }).valid).toBe(false);
    expect(validateStatusChange({ status: "" }).valid).toBe(false);
    expect(validateStatusChange({ status: "Resolved" }).valid).toBe(false);
  });
});

describe("validateEnum()", () => {
  it("passes when value is in allow-list", () => {
    expect(validateEnum("suggestion", "Type", ["suggestion", "complaint"]).valid).toBe(true);
  });
  it("fails when value is not in allow-list", () => {
    expect(validateEnum("unknown", "Type", ["suggestion", "complaint"]).valid).toBe(false);
  });
  it("is case-sensitive", () => {
    expect(validateEnum("Suggestion", "Type", ["suggestion"]).valid).toBe(false);
  });
});
