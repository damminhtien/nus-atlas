/* Async content repository backed by catalog, outline, and lazy JSON shards. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.ATLAS_CONTENT_REPOSITORY = factory;
})(typeof globalThis === "object" ? globalThis : this, function createContentRepository(options) {
  const config = options || {};
  const catalog = config.catalog || { courses: [] };
  const transport = config.transport;
  const packages = new Map();
  const lessons = new Map();
  const pendingCourses = new Map();
  const pendingLessons = new Map();
  const pendingSlides = new Map();
  const pendingTextbooks = new Map();
  const pendingSourceManifests = new Map();
  const sourceTypes = config.sourceTypes || catalog.sourceTypes || {};
  const schedule = config.schedule || {};

  if (!transport || typeof transport.loadCourse !== "function" || typeof transport.loadLesson !== "function") {
    throw new TypeError("Content repository requires an async content transport");
  }

  function entry(courseId) { return (catalog.courses || []).find(item => item.code === courseId) || null; }
  function outlineLesson(courseId, item, moduleId) {
    return {
      ...item,
      courseId,
      moduleId,
      questions: [],
      questionIds: Array.isArray(item.questionIds) ? item.questionIds.slice() : [],
      labIds: Array.isArray(item.visualIds) ? item.visualIds.slice() : [],
      schemaVersion: "nus.lesson-outline.v1"
    };
  }
  function packageFor(courseId) { return packages.get(courseId) || null; }
  function cachedLesson(courseId, lessonId) { return lessons.get(`${courseId}/${lessonId}`) || null; }
  function registerCourse(courseId, packageData) { packages.set(courseId, packageData); return packageData; }
  function registerLesson(courseId, lessonId, payload) {
    const lesson = {
      ...(payload.lesson || payload),
      questions: payload.questions || [],
      ...(payload.studyKit || {}),
      schemaVersion: (payload.lesson || payload).schemaVersion || "nus.lesson.v1"
    };
    lessons.set(`${courseId}/${lessonId}`, lesson);
    const packageData = packageFor(courseId);
    if (packageData) {
      if (payload.labs) packageData.labs = { ...(packageData.labs || {}), ...payload.labs };
      if (payload.visuals) packageData.visuals = { ...(packageData.visuals || {}), ...payload.visuals };
    }
    return lesson;
  }
  function courseOutline(courseId) {
    const packageData = packageFor(courseId);
    if (packageData && packageData.outline) return packageData.outline;
    const item = entry(courseId);
    return item && (item.outlineData || item.modules) ? {
      schemaVersion: "nus.course-outline.v1",
      courseId,
      course: item.course,
      modules: item.outlineData ? item.outlineData.modules || [] : item.modules || [],
      collections: item.outlineData ? item.outlineData.collections || [] : item.collections || [],
      timelineLessonIds: item.outlineData ? item.outlineData.timelineLessonIds || [] : item.timelineLessonIds || [],
      labs: item.labs || []
    } : null;
  }
  function listCourses() {
    return (catalog.courses || []).map(item => ({ ...item.course, code: item.code, schemaVersion: "nus.course.v1" }));
  }
  function getCourse(courseId) {
    const packageData = packageFor(courseId);
    if (packageData && packageData.course) return packageData.course;
    const item = entry(courseId);
    return item ? { ...item.course, code: item.code, schemaVersion: "nus.course.v1" } : null;
  }
  function getCatalog(courseId) {
    const outline = courseOutline(courseId);
    if (!outline) return { modules: [] };
    return {
      modules: (outline.modules || []).map(module => ({ ...module, lessons: (module.lessons || []).map(lesson => outlineLesson(courseId, lesson, module.id)) })),
      collections: (outline.collections || []).map(collection => ({ ...collection, lessonIds: (collection.lessonIds || []).slice() })),
      timelineLessonIds: Array.isArray(outline.timelineLessonIds) ? outline.timelineLessonIds.slice() : []
    };
  }
  function listLessons(courseId) {
    const packageData = packageFor(courseId);
    const catalogData = getCatalog(courseId);
    const modules = packageData && packageData.content ? packageData.content.modules || [] : catalogData.modules;
    const all = modules.flatMap(module => (module.lessons || []).map(lesson => cachedLesson(courseId, lesson.id) || { ...lesson }));
    const byId = new Map(all.map(lesson => [lesson.id, lesson]));
    const order = (packageData && packageData.content && packageData.content.timelineLessonIds) || catalogData.timelineLessonIds || [];
    if (!order.length) return all;
    return [...order.map(id => byId.get(id)).filter(Boolean), ...all.filter(lesson => !order.includes(lesson.id))];
  }
  function peekLesson(courseId, lessonId) { return cachedLesson(courseId, lessonId) || listLessons(courseId).find(lesson => lesson.id === lessonId) || null; }
  function needsLoad(courseId) { return !!entry(courseId) && !packageFor(courseId); }
  function isLessonLoaded(courseId, lessonId) { return !!cachedLesson(courseId, lessonId); }
  async function loadCourse(courseId) {
    if (packageFor(courseId)) return packageFor(courseId);
    if (pendingCourses.has(courseId)) return pendingCourses.get(courseId);
    const request = transport.loadCourse(courseId).then(packageData => packageData ? registerCourse(courseId, packageData) : null).finally(() => pendingCourses.delete(courseId));
    pendingCourses.set(courseId, request);
    return request;
  }
  async function getCourseOutline(courseId) {
    const loaded = await loadCourse(courseId);
    return loaded ? loaded.outline : null;
  }
  async function loadLesson(courseId, lessonId) {
    const cached = cachedLesson(courseId, lessonId);
    if (cached) return cached;
    const key = `${courseId}/${lessonId}`;
    if (pendingLessons.has(key)) return pendingLessons.get(key);
    const request = loadCourse(courseId).then(() => transport.loadLesson(courseId, lessonId)).then(payload => payload ? registerLesson(courseId, lessonId, payload) : null).finally(() => pendingLessons.delete(key));
    pendingLessons.set(key, request);
    return request;
  }
  async function getLesson(courseId, lessonId) { return loadLesson(courseId, lessonId); }
  async function getQuestions(courseId, lessonId) { const lesson = await loadLesson(courseId, lessonId); return lesson ? lesson.questions || [] : []; }
  async function getStudyKit(courseId, lessonId) { const lesson = await loadLesson(courseId, lessonId); return lesson ? { lessonId, flashcards: lesson.flashcards || [], homework: lesson.homework || [], codeExercises: lesson.codeExercises || [] } : null; }
  async function loadSlides(courseId) {
    const packageData = await loadCourse(courseId);
    if (!packageData) return [];
    if (Array.isArray(packageData.slideSets)) return packageData.slideSets;
    if (pendingSlides.has(courseId)) return pendingSlides.get(courseId);
    const request = transport.loadSlides(courseId).then(slideSets => {
      packageData.slideSets = slideSets || [];
      return packageData.slideSets;
    }).finally(() => pendingSlides.delete(courseId));
    pendingSlides.set(courseId, request);
    return request;
  }
  async function loadTextbook(courseId) {
    const packageData = await loadCourse(courseId);
    if (!packageData) return null;
    if (packageData.textbook) return packageData.textbook;
    if (!packageData.textbookAsset || typeof transport.loadTextbook !== "function") return null;
    if (pendingTextbooks.has(courseId)) return pendingTextbooks.get(courseId);
    const request = transport.loadTextbook(courseId).then(textbook => { packageData.textbook = textbook; return textbook; }).finally(() => pendingTextbooks.delete(courseId));
    pendingTextbooks.set(courseId, request);
    return request;
  }
  async function loadSourceManifest(courseId) {
    const packageData = await loadCourse(courseId);
    if (!packageData) return null;
    if (packageData.sourceManifest) return packageData.sourceManifest;
    if (!packageData.sourceManifestAsset || typeof transport.loadSourceManifest !== "function") return null;
    if (pendingSourceManifests.has(courseId)) return pendingSourceManifests.get(courseId);
    const request = transport.loadSourceManifest(courseId).then(value => { packageData.sourceManifest = value; return value; }).finally(() => pendingSourceManifests.delete(courseId));
    pendingSourceManifests.set(courseId, request);
    return request;
  }
  function getAssessment(courseId) { const packageData = packageFor(courseId); const item = entry(courseId); return packageData && Array.isArray(packageData.assessments) ? packageData.assessments.slice() : item && Array.isArray(item.assessments) ? item.assessments.slice() : []; }
  function listAssessments() { return listCourses().flatMap(course => getAssessment(course.code)); }
  function getAssessmentMap(courseId) { const packageData = packageFor(courseId); return packageData && packageData.assessmentMap ? packageData.assessmentMap : null; }
  function getLab(labId) { for (const packageData of packages.values()) if (packageData.labs && packageData.labs[labId]) return packageData.labs[labId]; return null; }
  function listLabs(courseId) { const packageData = packageFor(courseId); if (packageData) return Object.entries(packageData.labs || {}).map(([id, lab]) => ({ id, ...lab })); const item = entry(courseId); return item ? (item.labs || []).map(lab => ({ ...lab })) : []; }
  function getVisual(visualId) { for (const packageData of packages.values()) if (packageData.visuals && packageData.visuals[visualId]) return packageData.visuals[visualId]; return null; }
  function listVisuals() { return Object.assign({}, ...[...packages.values()].map(packageData => packageData.visuals || {})); }
  function getSchedule(courseId) { if (courseId) return schedule[courseId] || (entry(courseId) && entry(courseId).schedule) || null; return { courses: schedule }; }
  function getSourceTypes() { return sourceTypes; }
  function getSourceCatalog(courseId) { const packageData = packageFor(courseId); return packageData && packageData.sources ? packageData.sources.slice() : []; }
  function getTextbook(courseId) { const packageData = packageFor(courseId); return packageData && packageData.textbook ? packageData.textbook : null; }
  function getQuestionBank(courseId) { const packageData = packageFor(courseId); return packageData && packageData.questionBank ? packageData.questionBank : null; }
  function getSourceManifest(courseId) { const packageData = packageFor(courseId); return packageData && packageData.sourceManifest ? packageData.sourceManifest : null; }
  function getSlideSets(courseId) { const packageData = packageFor(courseId); return packageData && Array.isArray(packageData.slideSets) ? packageData.slideSets.slice() : []; }
  function listSlideSets(courseId) { const item = entry(courseId); return item ? Object.keys(item.slideAssets || {}).map(id => ({ id })) : []; }
  function getSlideSet(courseId, slideSetId) { return getSlideSets(courseId).find(item => item.id === slideSetId) || null; }
  function getSlide(courseId, slideSetId, slideNumber) { const set = getSlideSet(courseId, slideSetId); return set && set.slides ? set.slides.find(slide => Number(slide.number) === Number(slideNumber)) || null : null; }
  function hasTextbook(courseId) { const item = entry(courseId); const packageData = packageFor(courseId); return !!((packageData && packageData.textbookAsset) || (item && item.hasTextbook)); }
  function stats() { return { courses: listCourses().length, lessons: listCourses().reduce((count, course) => count + listLessons(course.code).length, 0), loadedCourses: packages.size, loadedLessons: lessons.size }; }

  return Object.freeze({ listCourses, getCourse, peekCourse: getCourse, getCourseOutline, getCatalog, listLessons, peekLesson, getLesson, loadCourse, loadLesson, getQuestions, getStudyKit, loadSlides, loadTextbook, loadSourceManifest, needsLoad, isLessonLoaded, getAssessment, listAssessments, getAssessmentMap, getLab, listLabs, getVisual, listVisuals, getSchedule, getSourceTypes, getSourceCatalog, getTextbook, hasTextbook, getQuestionBank, getSourceManifest, listSlideSets, getSlideSets, getSlideSet, getSlide, stats });
});
