/* Lightweight static-site access gate. This is a UX gate, not a security boundary. */
(function (root) {
  "use strict";

  const PASSCODE = "658215";
  const DEFAULT_USERNAME = "damminhtien";
  const SESSION_KEY = "atlas.access.v1";
  const doc = root.document;
  let unlocked = false;
  let pendingCredential = null;
  let resolveAccess;

  const accessReady = new Promise(resolve => { resolveAccess = resolve; });
  root.ATLAS_ACCESS_READY = accessReady;

  function hasSessionAccess() {
    try { return root.sessionStorage.getItem(SESSION_KEY) === "unlocked"; } catch (_) { return false; }
  }

  function rememberSession() {
    try { root.sessionStorage.setItem(SESSION_KEY, "unlocked"); } catch (_) { /* private browsing may reject storage */ }
  }

  function release(gate, credential) {
    if (unlocked) return;
    unlocked = true;
    pendingCredential = credential || null;
    rememberSession();
    doc.documentElement.classList.remove("atlas-locked");
    if (gate) {
      gate.classList.add("is-unlocked");
      gate.setAttribute("aria-hidden", "true");
      setTimeout(() => gate.remove(), 280);
    }
    // Keep the password in memory only long enough for the boot flow to hand
    // it to the authenticated sync client. It is never written to storage.
    resolveAccess(pendingCredential);
  }

  function mount() {
    const gate = doc && doc.getElementById("access-gate");
    if (!gate || hasSessionAccess()) {
      if (gate) gate.remove();
      doc.documentElement.classList.remove("atlas-locked");
      release(null);
      return;
    }

    const input = gate.querySelector("#access-passcode");
    const status = gate.querySelector("#access-code-status");
    const dots = Array.from(gate.querySelectorAll("#access-code-dots i"));
    let failureTimer;

    function setValue(value) {
      input.value = String(value || "").replace(/\D/g, "").slice(0, PASSCODE.length);
      dots.forEach((dot, index) => dot.classList.toggle("is-filled", index < input.value.length));
    }

    function fail() {
      gate.classList.remove("is-error");
      void gate.offsetWidth;
      gate.classList.add("is-error");
      status.textContent = "That passcode is not correct — try again";
      clearTimeout(failureTimer);
      failureTimer = setTimeout(() => { gate.classList.remove("is-error"); status.textContent = "Enter your 6-digit passcode"; }, 1200);
      setValue("");
      gate.querySelector("[data-access-digit]")?.focus();
    }

    function check() {
      if (input.value.length !== PASSCODE.length) return;
      if (input.value === PASSCODE) release(gate, { username: DEFAULT_USERNAME, password: PASSCODE });
      else fail();
    }

    function addDigit(digit) {
      if (input.value.length >= PASSCODE.length) return;
      setValue(input.value + digit);
      check();
    }

    gate.querySelectorAll("[data-access-digit]").forEach(button => {
      button.addEventListener("click", () => addDigit(button.dataset.accessDigit));
    });
    gate.querySelector("[data-access-delete]")?.addEventListener("click", () => setValue(input.value.slice(0, -1)));
    input.addEventListener("input", () => { setValue(input.value); check(); });
    input.addEventListener("keydown", event => {
      if (event.key === "Escape") setValue("");
      if (event.key === "Enter") check();
    });
    gate.addEventListener("click", event => {
      if (event.target === gate || event.target.closest(".access-code-dots")) input.focus();
    });
    gate.querySelector("[data-access-digit]")?.focus();
  }

  root.ATLAS_ACCESS_GATE = {
    isUnlocked: () => unlocked,
    consumeCredential() {
      const credential = pendingCredential;
      pendingCredential = null;
      return credential;
    }
  };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})(typeof window === "object" ? window : globalThis);
