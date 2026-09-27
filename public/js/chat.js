/* =============================================================
   Aizen AI — Chat Widget (client-side)
   public/js/chat.js

   Architecture:
     Browser → POST /api/chat → Express backend → Gemini API

   IMPORTANT:
     - No API key is ever stored or sent from the browser.
     - The browser only talks to /api/chat on our own server.
     - User identity comes from the server session (cookie-based).
   ============================================================= */

"use strict";

(function initAizenChat() {
  /* ----------------------------------------------------------------
     DOM references (injected via chat-widget partial)
  ---------------------------------------------------------------- */
  const fab          = document.getElementById("chatFab");
  const panel        = document.getElementById("chatPanel");
  const closeBtn     = document.getElementById("chatClose");
  const messages     = document.getElementById("chatMessages");
  const input        = document.getElementById("chatInput");
  const sendBtn      = document.getElementById("chatSend");
  const escalateBtn  = document.getElementById("chatEscalate");

  if (!fab || !panel) return; // Widget not present on this page

  /* ----------------------------------------------------------------
     State
  ---------------------------------------------------------------- */
  let conversationId = null;
  let isOpen         = false;
  let isSending      = false;
  let isEscalated    = false;

  /* ----------------------------------------------------------------
     Toggle panel open/close
  ---------------------------------------------------------------- */
  function openPanel() {
    isOpen = true;
    panel.classList.add("is-open");
    fab.setAttribute("aria-expanded", "true");
    fab.querySelector(".chat-fab__label").textContent = "Close Chat";
    setTimeout(() => { if (input) input.focus(); }, 210);
    // Show welcome message if no messages yet
    if (messages && messages.children.length === 0) {
      appendMessage("ai", "Hi! I'm **Aizen AI**, the CSPC Feedback System assistant. How can I help you today?");
    }
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("is-open");
    fab.setAttribute("aria-expanded", "false");
    fab.querySelector(".chat-fab__label").textContent = "Aizen AI";
    fab.focus();
  }

  fab.addEventListener("click", () => {
    if (isOpen) closePanel(); else openPanel();
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closePanel);
  }

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closePanel();
  });

  /* ----------------------------------------------------------------
     Append a message bubble to the chat
  ---------------------------------------------------------------- */
  function appendMessage(senderType, text, isUnavailable = false) {
    if (!messages) return;

    const wrapper = document.createElement("div");
    wrapper.className = `chat-message chat-message--${senderType}`;

    const senderLabel = document.createElement("div");
    senderLabel.className = "chat-message__sender";
    senderLabel.textContent =
      senderType === "ai"    ? "Aizen AI" :
      senderType === "admin" ? "Administrator" :
      "You";

    const bubble = document.createElement("div");
    bubble.className = "chat-message__bubble";

    if (isUnavailable) {
      bubble.classList.add("chat-unavailable");
    }

    // Render basic markdown: **bold**, *italic*, newlines
    bubble.innerHTML = sanitizeAndFormat(text);

    wrapper.appendChild(senderLabel);
    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  /* ----------------------------------------------------------------
     Basic markdown renderer (bold, italic, line-breaks)
     Note: We sanitize by using textContent first then replace
     only known-safe patterns.
  ---------------------------------------------------------------- */
  function sanitizeAndFormat(text) {
    // Escape HTML entities first
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    // Then apply safe formatting
    return escaped
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,    "<em>$1</em>")
      .replace(/\n/g,            "<br>");
  }

  /* ----------------------------------------------------------------
     Typing indicator
  ---------------------------------------------------------------- */
  let typingEl = null;

  function showTyping() {
    if (!messages || typingEl) return;
    typingEl = document.createElement("div");
    typingEl.className = "chat-typing";
    typingEl.innerHTML = `
      <div>
        <span class="chat-typing__label">Aizen AI</span>
        <div class="chat-typing__dots">
          <span class="chat-typing__dot"></span>
          <span class="chat-typing__dot"></span>
          <span class="chat-typing__dot"></span>
        </div>
      </div>`;
    messages.appendChild(typingEl);
    scrollToBottom();
  }

  function hideTyping() {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  /* ----------------------------------------------------------------
     Scroll to latest message
  ---------------------------------------------------------------- */
  function scrollToBottom() {
    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
  }

  /* ----------------------------------------------------------------
     Send message to /api/chat
  ---------------------------------------------------------------- */
  async function sendMessage() {
    if (!input || isSending) return;

    const text = input.value.trim();
    if (!text) return;
    if (text.length > 1000) {
      appendMessage("ai", "Your message is too long (max 1000 characters). Please shorten it.");
      return;
    }

    // Render user bubble immediately
    appendMessage("user", text);
    input.value = "";
    autoResizeInput();

    isSending = true;
    if (sendBtn) sendBtn.disabled = true;
    showTyping();

    try {
      const body = { message: text };
      if (conversationId) body.conversationId = conversationId;

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      hideTyping();

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Something went wrong. Please try again.";
        appendMessage("ai", errMsg, true);
      } else {
        conversationId = data.conversationId || conversationId;
        appendMessage(data.senderType || "ai", data.reply, data.unavailable === true);
      }
    } catch (_networkErr) {
      hideTyping();
      appendMessage(
        "ai",
        "Aizen AI is temporarily unavailable. Please try again later or use 'Talk to an Admin'.",
        true
      );
    } finally {
      isSending = false;
      if (sendBtn) sendBtn.disabled = false;
      if (input)  input.focus();
    }
  }

  /* ----------------------------------------------------------------
     Send on button click or Enter (Shift+Enter = newline)
  ---------------------------------------------------------------- */
  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    input.addEventListener("input", autoResizeInput);
  }

  function autoResizeInput() {
    if (!input) return;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
  }

  /* ----------------------------------------------------------------
     Escalate to admin
  ---------------------------------------------------------------- */
  if (escalateBtn) {
    escalateBtn.addEventListener("click", async () => {
      if (isEscalated || isSending) return;

      if (!conversationId) {
        // No conversation yet — just inform the user
        appendMessage(
          "ai",
          "To contact an administrator, please first send a message so I can create a conversation record, then click 'Talk to an Admin' again."
        );
        return;
      }

      escalateBtn.disabled = true;
      escalateBtn.textContent = "Escalating…";

      try {
        const res = await fetch("/api/chat/escalate", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ conversationId }),
        });

        if (res.ok) {
          isEscalated = true;
          appendMessage(
            "ai",
            "Your conversation has been escalated to an **Administrator**. A CSPC staff member will review your concern. Thank you for your patience."
          );
          escalateBtn.textContent = "Escalated ✓";
        } else {
          escalateBtn.disabled = false;
          escalateBtn.textContent = "Talk to an Admin";
          appendMessage("ai", "Could not escalate at this time. Please try again.");
        }
      } catch (_err) {
        escalateBtn.disabled = false;
        escalateBtn.textContent = "Talk to an Admin";
        appendMessage("ai", "Could not escalate at this time. Please check your connection.");
      }
    });
  }

})();
