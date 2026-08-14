(function () {
  "use strict";
  window.NUS_SCHEDULE = {
    timezone: "Asia/Singapore",
    fetchedAt: "2026-08-14",
    source: "https://api.nusmods.com/v2/2026-2027/semesters/1/{code}/semesterData.json",
    courses: {
      DSA5101: {
        exam: { date: "2026-11-28T13:00:00+08:00", durationMinutes: 150, status: "confirmed" },
        timetable: [
          { day: "Monday", start: "19:00", end: "22:00", venue: "LT20", weeks: "1-13" },
          { day: "Wednesday", start: "14:00", end: "17:00", venue: "LT20", weeks: "1-13" }
        ]
      },
      DSA5104: {
        exam: { date: "2026-11-30T13:00:00+08:00", durationMinutes: 150, status: "confirmed" },
        timetable: [
          { day: "Wednesday", start: "19:00", end: "22:00", venue: "LT29", weeks: "1-13" },
          { day: "Saturday", start: "10:00", end: "13:00", venue: "LT20", weeks: "1-13" }
        ]
      },
      DSA5105: {
        exam: { date: "2026-11-27T14:30:00+08:00", durationMinutes: 150, status: "confirmed" },
        timetable: [
          { day: "Friday", start: "19:00", end: "22:00", venue: "LT26", weeks: "1-13" },
          { day: "Tuesday", start: "14:00", end: "17:00", venue: "LT20", weeks: "1-13" }
        ]
      },
      DSA5208: {
        exam: { date: null, durationMinutes: null, status: "pending" },
        timetable: [
          { day: "Tuesday", start: "19:00", end: "22:00", venue: "LT32", weeks: "1-13" },
          { day: "Monday", start: "14:00", end: "17:00", venue: "LT33", weeks: "1-13" }
        ]
      }
    }
  };
})();
