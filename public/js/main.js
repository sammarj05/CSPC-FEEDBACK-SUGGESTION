"use strict";

/**
 * public/js/main.js
 *
 * Client-side JavaScript for the CSPC Feedback System.
 *
 * Responsibilities:
 *  - Mobile navbar toggle
 *  - Character counters on form textareas/inputs
 *  - Auto-dismiss flash messages
 *  - Form submit loading state
 *
 * No framework dependencies — plain ES6.
 */

// ---------------------------------------------------------------
// Mobile navigation toggle
// ---------------------------------------------------------------
(function initNavToggle() {
  const toggle = document.getElementById("navToggle");
  const menu   = document.getElementById("navMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Close menu on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
})();

// ---------------------------------------------------------------
// Character counters
// ---------------------------------------------------------------
(function initCharCounters() {
  const pairs = [
    { inputId: "subject",         countId: "subjectCount" },
    { inputId: "description",     countId: "descCount"    },
    { inputId: "responseMessage", countId: "responseCount"},
  ];

  pairs.forEach(({ inputId, countId }) => {
    const input   = document.getElementById(inputId);
    const counter = document.getElementById(countId);
    if (!input || !counter) return;

    const max = parseInt(input.getAttribute("maxlength") || "0", 10);

    function update() {
      const len = input.value.length;
      counter.textContent = max ? `${len} / ${max}` : `${len} characters`;
      counter.style.color = (max && len > max * 0.9) ? "#ef4444" : "";
    }

    update();
    input.addEventListener("input", update);
  });
})();

// ---------------------------------------------------------------
// Auto-dismiss flash messages after 5 seconds
// ---------------------------------------------------------------
(function initFlashAutoDismiss() {
  const flashes = document.querySelectorAll(".flash");
  flashes.forEach((flash) => {
    setTimeout(() => {
      flash.style.transition = "opacity 0.4s ease";
      flash.style.opacity = "0";
      setTimeout(() => flash.remove(), 400);
    }, 5000);
  });
})();

// ---------------------------------------------------------------
// Feedback attachment preview and client-side validation
// ---------------------------------------------------------------
(function initFeedbackAttachment() {
  const input = document.getElementById("attachment");
  const preview = document.getElementById("attachmentPreview");
  const previewImage = document.getElementById("attachmentPreviewImage");
  const fileName = document.getElementById("attachmentFileName");
  const removeButton = document.getElementById("removeAttachment");
  const error = document.getElementById("attachmentError");
  const form = document.getElementById("feedbackForm");
  if (!input || !preview || !previewImage || !fileName || !removeButton || !error || !form) return;

  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  let previewUrl = null;

  function clearPreview() {
    preview.hidden = true;
    previewImage.removeAttribute("src");
    fileName.textContent = "";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  function clearAttachment() {
    input.value = "";
    clearPreview();
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
  }

  function clearError() {
    error.textContent = "";
    error.hidden = true;
  }

  input.addEventListener("change", () => {
    clearPreview();
    clearError();
    const [file] = input.files;
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      showError("Only JPG, JPEG, PNG, and WebP images are allowed.");
      clearAttachment();
      return;
    }
    if (file.size > maxSize) {
      showError("The image must be 5 MB or smaller.");
      clearAttachment();
      return;
    }

    previewUrl = URL.createObjectURL(file);
    previewImage.src = previewUrl;
    fileName.textContent = file.name;
    preview.hidden = false;
  });

  removeButton.addEventListener("click", () => {
    clearAttachment();
    clearError();
    input.focus();
  });

  form.addEventListener("submit", (event) => {
    if (!input.files.length) return;
    const [file] = input.files;
    if (!allowedTypes.includes(file.type) || file.size > maxSize) {
      event.preventDefault();
      showError("Choose a JPG, JPEG, PNG, or WebP image that is 5 MB or smaller.");
    }
  });
})();

// ---------------------------------------------------------------
// Form submit loading state (prevent double submission)
// ---------------------------------------------------------------
(function initFormLoadingState() {
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (event.defaultPrevented) return;
      const submitBtn = form.querySelector('[type="submit"]');
      if (!submitBtn) return;
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing…";
    });
  });
})();
