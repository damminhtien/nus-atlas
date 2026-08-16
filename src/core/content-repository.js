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
  const artifacts = state.artifacts && typeof state.artifacts === "object" ? state.artifacts : {};
  const visuals = state.visuals && typeof state.visuals === "object" ? state.visuals : {};
  const schedule = state.schedule && typeof state.schedule === "object" ? state.schedule : { courses: {} };
  const provenance = state.provenance && typeof state.provenance === "object" ? state.provenance : {};
  const packages = state.packages && typeof state.packages === "object" ? state.packages : {};
  const packageLoader = typeof state.packageLoader === "function" ? state.packageLoader : null;

  function coursePackage(courseId) { return packages[courseId] || null; }
  function packageCourses() { return Object.values(packages).map(packageData => packageData.course).filter(Boolean); }
  function packageLoaded(courseId) { const packageData = coursePackage(courseId); return !!(packageData && packageData.content); }
  function needsLoad(courseId) { const packageData = coursePackage(courseId); return !!(packageData && packageData.asset && !packageLoaded(courseId)); }
  function registerPackage(courseId, packageData) {
    if (!courseId || !packageData || typeof packageData !== "object") throw new TypeError("A content package needs an id and object");
    packages[courseId] = packageData;
    return packageData;
  }
  function loadCourse(courseId) {
    if (packageLoaded(courseId)) return Promise.resolve(coursePackage(courseId));
    if (!packageLoader) return Promise.resolve(null);
    return Promise.resolve(packageLoader(courseId)).then(packageData => packageData ? registerPackage(courseId, packageData) : null);
  }
  function catalog(courseId) { return (coursePackage(courseId) && coursePackage(courseId).content) || content[courseId] || { modules: [] }; }
  function lessonRecord(courseId, module, lesson) {
    const kit = artifacts[lesson.id] || {};
    return {
      ...lesson,
      ...kit,
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
    const course = courses.find(item => item.code === courseId) || packageCourses().find(item => item.code === courseId);
    if (!course) return null;
    return {
      ...course,
      ...((coursePackage(courseId) && coursePackage(courseId).course) || {}),
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
    const packageData = courseId && coursePackage(courseId);
    if (packageData && Array.isArray(packageData.assessments)) return packageData.assessments.slice();
    return assessments.filter(item => !courseId || item.courseCode === courseId);
  }
  function getAssessmentMap(courseId) {
    const packageData = courseId && coursePackage(courseId);
    return packageData && packageData.assessmentMap ? packageData.assessmentMap : null;
  }
  function getLab(labId) {
    for (const item of Object.values(labs)) if (item && item.lessonId === labId) return item;
    for (const packageData of Object.values(packages)) if (packageData.labs && packageData.labs[labId]) return packageData.labs[labId];
    return labs[labId] || null;
  }
  function listLabs(courseId) {
    const merged = new Map();
    Object.entries(labs).forEach(([id, lab]) => { if (!courseId || lab.courseCode === courseId) merged.set(id, { id, ...lab }); });
    Object.values(packages).forEach(packageData => Object.entries(packageData.labs || {}).forEach(([id, lab]) => { if (!courseId || lab.courseCode === courseId) merged.set(id, { id, ...lab }); }));
    return [...merged.values()];
  }
  function getVisual(visualId) {
    for (const packageData of Object.values(packages)) if (packageData.visuals && packageData.visuals[visualId]) return packageData.visuals[visualId];
    return visuals[visualId] || null;
  }
  function getSchedule(courseId) { return courseId ? (schedule.courses || {})[courseId] || null : schedule; }
  function getSourceCatalog(courseId) {
    const course = courses.find(item => item.code === courseId) || packageCourses().find(item => item.code === courseId);
    if (!course) return [];
    const packageData = coursePackage(courseId);
    if (packageData && packageData.sources) return packageData.sources.slice();
    return [course.lectureSources || [], course.exerciseSources || [], course.textbookSources || [], course.referenceSources || []].flat();
  }
  function getTextbook(courseId) {
    const packageData = courseId && coursePackage(courseId);
    return packageData && packageData.textbook ? packageData.textbook : null;
  }
  function getQuestionBank(courseId) {
    const packageData = courseId && coursePackage(courseId);
    return packageData && packageData.questionBank ? packageData.questionBank : null;
  }
  function getSourceManifest(courseId) {
    const packageData = courseId && coursePackage(courseId);
    return packageData && packageData.sourceManifest ? packageData.sourceManifest : null;
  }
  function getSlideSets(courseId) {
    const packageData = courseId && coursePackage(courseId);
    return packageData && Array.isArray(packageData.slideSets) ? packageData.slideSets.slice() : [];
  }
  function getSlideSet(courseId, slideSetId) {
    return getSlideSets(courseId).find(slideSet => slideSet.id === slideSetId) || null;
  }
  function getSlide(courseId, slideSetId, slideNumber) {
    const slideSet = getSlideSet(courseId, slideSetId);
    return slideSet ? slideSet.slides.find(slide => slide.slideNumber === Number(slideNumber)) || null : null;
  }

  return Object.freeze({
    getCourse,
    getCatalog: catalog,
    getLesson,
    listLessons,
    getAssessment,
    getAssessmentMap,
    getLab,
    listLabs,
    getVisual,
    getSchedule,
    getSourceCatalog,
    getTextbook,
    getQuestionBank,
    getSourceManifest,
    getSlideSets,
    getSlideSet,
    getSlide,
    packageLoaded,
    needsLoad,
    registerPackage,
    loadCourse,
    getSourceTypes: () => state.sourceTypes && typeof state.sourceTypes === "object" ? state.sourceTypes : {},
    listCourses: () => {
      const merged = new Map(courses.map(course => [course.code, getCourse(course.code) || course]));
      packageCourses().forEach(course => merged.set(course.code, getCourse(course.code) || course));
      return [...merged.values()];
    },
    listAssessments: () => [...new Set([...courses.map(course => course.code), ...packageCourses().map(course => course.code)])].flatMap(courseId => getAssessment(courseId)),
    listVisuals: () => Object.assign({}, visuals, ...Object.values(packages).map(packageData => packageData.visuals || {})),
    getProvenance: () => provenance,
    stats: () => ({ courses: new Set([...courses.map(course => course.code), ...packageCourses().map(course => course.code)]).size, lessons: [...new Set([...courses.map(course => course.code), ...packageCourses().map(course => course.code)])].reduce((total, courseId) => total + listLessons(courseId).length, 0), assessments: assessments.length, labs: Object.keys(labs).length })
  });
});

// The static app loads this file after all data registries. Installing here keeps
// the legacy script order simple and makes the adapter the single runtime entrypoint.
if (typeof window === "object" && window.NUS_CONTENT_REPOSITORY) {
  window.NUS_REPOSITORY = window.NUS_CONTENT_REPOSITORY({
    courses: window.NUS_COURSES,
    content: window.NUS_CONTENT,
    assessments: window.NUS_ASSESSMENTS,
    artifacts: window.NUS_ARTIFACTS,
    labs: window.NUS_VISUAL_LABS,
    visuals: window.NUS_VISUALS,
    schedule: window.NUS_SCHEDULE,
    sourceTypes: window.NUS_SOURCE_TYPES,
    packages: window.NUS_CONTENT_PACKAGES,
    provenance: window.NUS_SOURCE_POLICY,
    packageLoader: window.NUS_CONTENT_PACKAGE_LOADER && window.NUS_CONTENT_PACKAGE_LOADER.load
  });
}
