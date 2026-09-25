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
// Form submit loading state (prevent double submission)
// ---------------------------------------------------------------
(function initFormLoadingState() {
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", () => {
      const submitBtn = form.querySelector('[type="submit"]');
      if (!submitBtn) return;
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing…";
    });
  });
})();
