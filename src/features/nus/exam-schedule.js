/* Exam schedule feature. Keeps countdown rendering and the dashboard reminder
 * on the same confirmed schedule/assessment data contract. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_EXAM_SCHEDULE_FEATURE = factory;
})(typeof globalThis === "object" ? globalThis : this, function createExamScheduleFeature(options) {
  const config = options || {};
  const getCourses = typeof config.getCourses === "function" ? config.getCourses : () => [];
  const getSchedule = typeof config.getSchedule === "function" ? config.getSchedule : () => ({ courses: {} });
  const getAssessments = typeof config.getAssessments === "function" ? config.getAssessments : () => [];
  const esc = typeof config.esc === "function" ? config.esc : value => String(value == null ? "" : value);
  const button = typeof config.button === "function" ? config.button : (label, href, cls) => '<a class="btn ' + (cls || "ghost") + '" href="' + esc(href) + '" data-route>' + esc(label) + "</a>";
  const formatDate = typeof config.formatDate === "function"
    ? config.formatDate
    : value => new Intl.DateTimeFormat("en-SG", { timeZone: "Asia/Singapore", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const isDashboard = typeof config.isDashboard === "function" ? config.isDashboard : () => true;
  let overlay = null;
  let timer = null;
  let opener = null;

  function scheduleCourses() {
    const value = getSchedule() || {};
    return value.courses || value;
  }

  function finalAssessment(code) {
    return getAssessments().find(item => item.courseCode === code && item.kind === "exam" && /final/i.test(item.title || ""));
  }

  function confirmedExams() {
    const schedules = scheduleCourses();
    return getCourses().map(course => {
      const exam = schedules[course.code] && schedules[course.code].exam;
      const assessment = finalAssessment(course.code);
      if (!exam || exam.status !== "confirmed" || !exam.date || !assessment) return null;
      const timestamp = Date.parse(exam.date);
      if (!Number.isFinite(timestamp)) return null;
      const officialDate = assessment && assessment.officialFacts && assessment.officialFacts.timing && assessment.officialFacts.timing.date;
      if (!officialDate || !String(exam.date).startsWith(officialDate)) return null;
      const weight = assessment && assessment.officialFacts && assessment.officialFacts.weight;
      return {
        code: course.code,
        title: assessment ? assessment.title : "Final exam",
        courseTitle: course.title || course.code,
        date: exam.date,
        timestamp,
        durationMinutes: exam.durationMinutes || (assessment && assessment.officialFacts && assessment.officialFacts.timing && assessment.officialFacts.timing.durationMinutes) || null,
        weight: weight && weight.value != null ? weight.value + "%" : weight && weight.label ? weight.label : ""
      };
    }).filter(Boolean).sort((a, b) => a.timestamp - b.timestamp);
  }

  function remaining(date, now = Date.now()) {
    const totalSeconds = Math.max(0, Math.floor((Date.parse(date) - now) / 1000));
    return {
      totalSeconds,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }

  function countdownLabel(date, now = Date.now()) {
    const left = remaining(date, now);
    const delta = Date.parse(date) - now;
    if (delta < 0) return "Exam passed";
    if (left.totalSeconds === 0) return "Exam time";
    return left.days + "d " + String(left.hours).padStart(2, "0") + "h " + String(left.minutes).padStart(2, "0") + "m " + String(left.seconds).padStart(2, "0") + "s";
  }

  function daysLabel(date, now = Date.now()) {
    const left = remaining(date, now);
    const delta = Date.parse(date) - now;
    if (delta < 0) return "Exam passed";
    return left.totalSeconds === 0 ? "Exam time" : left.days + " days left";
  }

  function renderCards(now = Date.now()) {
    return confirmedExams().map(item => '<div class="nus-exam-count" data-exam-course="' + esc(item.code) + '"><b>' + esc(item.code) + "</b><span>" + esc(formatDate(item.date)) + '</span><small data-exam-countdown="' + esc(item.date) + '">' + esc(daysLabel(item.date, now)) + "</small></div>").join("");
  }

  function close() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus();
    opener = null;
  }

  function updateCountdowns() {
    if (!overlay) return;
    overlay.querySelectorAll("[data-exam-countdown]").forEach(element => {
      element.textContent = countdownLabel(element.dataset.examCountdown);
    });
  }

  function trapFocus(event) {
    if (!overlay || event.key !== "Tab") return;
    const card = overlay.querySelector(".nus-exam-schedule-card");
    const focusables = [...card.querySelectorAll("a[href],button:not([disabled])")].filter(element => element.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function showPopup() {
    if (typeof document === "undefined" || !document.body || !isDashboard()) return false;
    if (document.querySelector(".intro-ov")) {
      window.setTimeout(showPopup, 250);
      return false;
    }
    const exams = confirmedExams();
    if (!exams.length) return false;
    close();
    opener = document.activeElement;
    overlay = document.createElement("div");
    overlay.className = "nus-exam-schedule-overlay";
    overlay.setAttribute("aria-labelledby", "nus-exam-schedule-title");
    const rows = exams.map(item => '<article class="nus-exam-schedule-row"><div><span class="nus-code">' + esc(item.code) + "</span><h3>" + esc(item.title) + "</h3><p>" + esc(item.courseTitle) + " · " + esc(formatDate(item.date)) + (item.durationMinutes ? " · " + esc(item.durationMinutes) + " min" : "") + '</p></div><div class="nus-exam-schedule-count"><b data-exam-countdown="' + esc(item.date) + '">' + esc(countdownLabel(item.date)) + "</b>" + (item.weight ? '<small>' + esc(item.weight) + " of final grade</small>" : "") + "</div></article>").join("");
    overlay.innerHTML = '<section class="nus-exam-schedule-card" role="dialog" aria-modal="true" aria-labelledby="nus-exam-schedule-title" tabindex="-1"><div class="nus-exam-schedule-head"><div><span class="eyebrow">Exam calendar · synced</span><h2 id="nus-exam-schedule-title">Your confirmed exam dates</h2></div><button class="nus-exam-schedule-close" type="button" data-exam-schedule-close aria-label="Close exam schedule">×</button></div><p class="nus-exam-schedule-lead">These countdowns combine the canonical course schedule with the matching final-assessment record. Pending quizzes, midterms, and project dates are not guessed.</p><div class="nus-exam-schedule-list">' + rows + '</div><div class="nus-exam-schedule-actions">' + button("Open planner", "#/nus/planner", "primary") + '<button class="btn ghost" type="button" data-exam-schedule-close>Continue studying</button></div><p class="nus-muted nus-exam-schedule-note">Check CourseReg@EduRec for venue and seat details when released.</p></section>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", event => {
      if (event.target === overlay || event.target.closest("[data-exam-schedule-close]")) close();
      if (event.target.closest("[data-route]")) close();
    });
    overlay.addEventListener("keydown", event => {
      if (event.key === "Escape") close();
      else trapFocus(event);
    });
    const card = overlay.querySelector(".nus-exam-schedule-card");
    const first = overlay.querySelector("[data-exam-schedule-close]");
    (first || card).focus();
    timer = window.setInterval(updateCountdowns, 1000);
    return true;
  }

  return Object.freeze({ confirmedExams, remaining, countdownLabel, daysLabel, renderCards, showPopup, close });
});
