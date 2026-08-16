/* Small, persistent timer shared by source readers. It measures active time
 * on the current reader surface and deliberately stays out of study mastery. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.NUS_READING_TIMER = factory;
})(typeof globalThis === "object" ? globalThis : this, function createReadingTimer(options) {
  const config = options || {};
  const storage = config.storage || (typeof localStorage !== "undefined" ? localStorage : null);
  const now = typeof config.now === "function" ? config.now : () => Date.now();
  let cleanup = null;

  function key(resourceId) { return `nus.reading-timer.v1:${resourceId}`; }
  function read(resourceId) {
    try {
      const value = storage && storage.getItem(key(resourceId));
      const parsed = value ? JSON.parse(value) : {};
      return { elapsed: Math.max(0, Number(parsed.elapsed) || 0) };
    } catch (_) {
      return { elapsed: 0 };
    }
  }
  function write(resourceId, elapsed) {
    try {
      if (storage) storage.setItem(key(resourceId), JSON.stringify({ elapsed: Math.max(0, Math.round(elapsed)) }));
    } catch (_) {
      // Timer persistence is optional in private or restricted browsing.
    }
  }
  function format(seconds) {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const secs = value % 60;
    return `${hours ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
  }
  function render(resourceId) {
    const state = read(resourceId);
    return `<aside class="nus-reading-timer" data-nus-reading-timer="${esc(resourceId)}" aria-label="Active reading timer"><span class="nus-reading-timer-label">Reading time</span><strong data-nus-timer-value>${format(state.elapsed)}</strong><button class="btn ghost" type="button" data-nus-timer-toggle>Start</button><button class="nus-reading-timer-reset" type="button" data-nus-timer-reset>Reset</button></aside>`;
  }
  function stop() {
    if (cleanup) cleanup();
    cleanup = null;
  }
  function bind(container) {
    stop();
    const timer = container && typeof container.querySelector === "function" ? container.querySelector("[data-nus-reading-timer]") : null;
    if (!timer) return () => {};
    const resourceId = timer.getAttribute("data-nus-reading-timer") || "reader";
    const valueNode = timer.querySelector("[data-nus-timer-value]");
    const toggle = timer.querySelector("[data-nus-timer-toggle]");
    const reset = timer.querySelector("[data-nus-timer-reset]");
    let elapsed = read(resourceId).elapsed;
    let startedAt = now();
    let running = true;
    let interval = null;
    function elapsedNow() { return elapsed + (running ? Math.max(0, Math.floor((now() - startedAt) / 1000)) : 0); }
    function persist() { write(resourceId, elapsedNow()); }
    function update() {
      if (valueNode) valueNode.textContent = format(elapsedNow());
      if (toggle) toggle.textContent = running ? "Pause" : "Start";
    }
    function pause() {
      elapsed = elapsedNow();
      running = false;
      persist();
      update();
    }
    function start() {
      elapsed = elapsedNow();
      startedAt = now();
      running = true;
      update();
    }
    function clear() {
      elapsed = 0;
      startedAt = now();
      write(resourceId, 0);
      update();
    }
    toggle?.addEventListener("click", () => (running ? pause() : start()));
    reset?.addEventListener("click", clear);
    interval = setInterval(update, 1000);
    update();
    cleanup = () => {
      if (running) elapsed = elapsedNow();
      write(resourceId, elapsed);
      if (interval) clearInterval(interval);
      interval = null;
    };
    return cleanup;
  }

  return Object.freeze({ format, render, bind, stop });
});
