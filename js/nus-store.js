(function () {
  "use strict";
  const KEY = "nus.v1";
  const blank = () => ({ tasks: {}, lessons: {}, attempts: [], lastStudy: null });
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "null");
      return data && typeof data === "object" ? { ...blank(), ...data } : blank();
    } catch (_) { return blank(); }
  }
  let state = read();
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function touch() { state.lastStudy = new Date().toISOString(); save(); }
  window.NUS_STORE = {
    get raw() { return state; },
    task(id) { return state.tasks[id] || { status: "todo", checks: [] }; },
    setTask(id, patch) { state.tasks[id] = { ...this.task(id), ...patch }; touch(); },
    toggleCheck(id, index) {
      const task = this.task(id), checks = Array.isArray(task.checks) ? task.checks.slice() : [];
      checks[index] = !checks[index];
      this.setTask(id, { checks });
    },
    markLesson(id, done) { state.lessons[id] = !!done; touch(); },
    lessonDone(id) { return !!state.lessons[id]; },
    recordAttempt(result) { state.attempts = state.attempts.concat([{ ...result, at: new Date().toISOString() }]).slice(-100); touch(); },
    attempts() { return state.attempts.slice(); },
    courseProgress(code, lessons) {
      const all = (lessons || []).filter(Boolean), done = all.filter(l => this.lessonDone(l.id)).length;
      return { done, total: all.length, pct: all.length ? Math.round(done / all.length * 100) : 0 };
    },
    reset() { state = blank(); save(); }
  };
})();
