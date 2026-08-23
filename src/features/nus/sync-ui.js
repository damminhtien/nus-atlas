/* Small account surface for cross-device Atlas progress sync. */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_SYNC_UI = factory;
})(typeof globalThis === "object" ? globalThis : this, function createSyncUi(config) {
  const options = config || {};
  const doc = options.document || (typeof document === "object" ? document : null);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  let mounted = false;
  let modal = null;

  function label(status) {
    return {
      "signed-out": "Sign in to sync",
      ready: "Sync progress",
      syncing: "Syncing…",
      synced: "Synced",
      error: "Sync unavailable"
    }[status] || "Sync progress";
  }

  function buttonState(button, client) {
    if (!button) return;
    const status = client.status();
    button.textContent = label(status);
    button.dataset.syncStatus = status;
    button.setAttribute("aria-label", status === "synced" ? "Study progress synced" : "Sync study progress");
    button.disabled = status === "syncing";
  }

  function close() {
    if (modal) modal.remove();
    modal = null;
  }

  function open(client, button) {
    if (modal) return;
    modal = doc.createElement("div");
    modal.className = "atlas-sync-overlay";
    modal.innerHTML = `<section class="atlas-sync-card" role="dialog" aria-modal="true" aria-labelledby="atlas-sync-title"><button class="atlas-sync-close" type="button" aria-label="Close sync dialog">×</button><span class="eyebrow">NUS Atlas · cloud progress</span><h2 id="atlas-sync-title">Sync your study progress</h2><p class="atlas-sync-copy">Sign in on each device to keep lessons, practice, review schedules and reading positions together. Atlas never uploads Chrome cookies, history or saved passwords.</p><form><label>Username<input name="username" autocomplete="username" required value=""></label><label>Password<input name="password" type="password" autocomplete="current-password" inputmode="numeric" required minlength="6"></label><p class="atlas-sync-error" role="alert" hidden></p><div class="atlas-sync-actions"><button class="btn ghost" type="button" data-sync-cancel>Cancel</button><button class="btn primary" type="submit">Sign in and sync</button></div></form></section>`;
    doc.body.appendChild(modal);
    const form = modal.querySelector("form");
    const username = form.querySelector("[name=username]");
    const password = form.querySelector("[name=password]");
    const error = modal.querySelector(".atlas-sync-error");
    const submit = form.querySelector("[type=submit]");
    const closeButton = modal.querySelector(".atlas-sync-close");
    const cancel = modal.querySelector("[data-sync-cancel]");
    const dismiss = () => { close(); button?.focus(); };
    closeButton.addEventListener("click", dismiss);
    cancel.addEventListener("click", dismiss);
    modal.addEventListener("click", event => { if (event.target === modal) dismiss(); });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      error.hidden = true;
      submit.disabled = true;
      submit.textContent = "Syncing…";
      try {
        await client.login(username.value, password.value);
        dismiss();
        buttonState(button, client);
      } catch (reason) {
        error.textContent = reason && reason.message ? reason.message : "Could not sign in. Try again.";
        error.hidden = false;
        submit.disabled = false;
        submit.textContent = "Sign in and sync";
        password.select();
      }
    });
    username.focus();
  }

  function mount(client) {
    if (mounted || !doc || !client || !client.endpoint) return;
    const button = doc.getElementById("atlas-sync-btn");
    if (!button) return;
    mounted = true;
    buttonState(button, client);
    button.addEventListener("click", () => client.isSignedIn() ? client.syncNow() : open(client, button));
    client.onStatus(() => buttonState(button, client));
    if (client.isSignedIn()) client.syncNow();
  }

  return Object.freeze({ mount });
});
