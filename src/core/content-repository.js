/* Shared NUS content boundary.
 *
 * The browser currently loads legacy IIFE data files. This adapter gives views a
 * stable API while those files are migrated to package JSON one course at a time.
 * It is also CommonJS-compatible so the same contract can be tested in Node.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.NUS_CONTENT_REPOSITORY = factory;
})(typeof globalThis === "object" ? globalThis : this, function createContentRepository(input) {
  const state = input || {};
  const courses = Array.isArray(state.courses) ? state.courses : [];
  const content = state.content && typeof state.content === "object" ? state.content : {};
  const assessments = Array.isArray(state.assessments) ? state.assessments : [];
  const labs = state.labs && typeof state.labs === "object" ? state.labs : {};
  const visuals = state.visuals && typeof state.visuals === "object" ? state.visuals : {};
  const schedule = state.schedule && typeof state.schedule === "object" ? state.schedule : { courses: {} };
  const provenance = state.provenance && typeof state.provenance === "object" ? state.provenance : {};

  function catalog(courseId) { return content[courseId] || { modules: [] }; }
  function lessonRecord(courseId, module, lesson) {
    return {
      ...lesson,
      courseId,
      moduleId: module.id,
      sourceRefs: Array.isArray(lesson.sourceRefs) ? lesson.sourceRefs.slice() : [],
      questionIds: (lesson.questions || []).map(question => question.id).filter(Boolean),
      labIds: Array.isArray(lesson.visualIds) ? lesson.visualIds.slice() : [],
      schemaVersion: "nus.lesson.v1"
    };
  }
  function listLessons(courseId) {
    return (catalog(courseId).modules || []).flatMap(module => (module.lessons || []).map(lesson => lessonRecord(courseId, module, lesson)));
  }
  function getCourse(courseId) {
    const course = courses.find(item => item.code === courseId);
    if (!course) return null;
    return {
      ...course,
      schemaVersion: "nus.course.v1",
      modules: (catalog(courseId).modules || []).map(module => ({
        ...module,
        lessons: (module.lessons || []).map(lesson => lessonRecord(courseId, module, lesson))
      }))
    };
  }
  function getLesson(courseId, lessonId) {
    return listLessons(courseId).find(lesson => lesson.id === lessonId) || null;
  }
  function getAssessment(courseId) {
    return assessments.filter(item => !courseId || item.courseCode === courseId);
  }
  function getLab(labId) { return labs[labId] || null; }
  function listLabs(courseId) { return Object.entries(labs).filter(([, lab]) => !courseId || lab.courseCode === courseId).map(([id, lab]) => ({ id, ...lab })); }
  function getVisual(visualId) { return visuals[visualId] || null; }
  function getSchedule(courseId) { return courseId ? (schedule.courses || {})[courseId] || null : schedule; }
  function getSourceCatalog(courseId) {
    const course = courses.find(item => item.code === courseId);
    if (!course) return [];
    return [course.lectureSources || [], course.textbookSources || [], course.referenceSources || []].flat();
  }

  return Object.freeze({
    getCourse,
    getCatalog: catalog,
    getLesson,
    listLessons,
    getAssessment,
    getLab,
    listLabs,
    getVisual,
    getSchedule,
    getSourceCatalog,
    getSourceTypes: () => state.sourceTypes && typeof state.sourceTypes === "object" ? state.sourceTypes : {},
    listCourses: () => courses.slice(),
    listAssessments: () => assessments.slice(),
    listVisuals: () => ({ ...visuals }),
    getProvenance: () => provenance,
    stats: () => ({ courses: courses.length, lessons: courses.reduce((total, course) => total + listLessons(course.code).length, 0), assessments: assessments.length, labs: Object.keys(labs).length })
  });
});

// The static app loads this file after all data registries. Installing here keeps
// the legacy script order simple and makes the adapter the single runtime entrypoint.
if (typeof window === "object" && window.NUS_CONTENT_REPOSITORY) {
  window.NUS_REPOSITORY = window.NUS_CONTENT_REPOSITORY({
    courses: window.NUS_COURSES,
    content: window.NUS_CONTENT,
    assessments: window.NUS_ASSESSMENTS,
    labs: window.NUS_VISUAL_LABS,
    visuals: window.NUS_VISUALS,
    schedule: window.NUS_SCHEDULE,
    sourceTypes: window.NUS_SOURCE_TYPES,
    provenance: window.NUS_SOURCE_POLICY
  });
}
