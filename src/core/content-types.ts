export type SourceType = "lecture" | "exercise" | "textbook" | "ref" | "assessment-derived";
export type EntityKey = `${string}:${string}/${string}`;
export type SourceRef = {
  sourceId: string;
  sourceType: SourceType;
  page: number;
  blockId?: string;
  blockType?: string;
  bbox?: [number, number, number, number];
  imageId?: string;
  role?: string;
  status?: string;
};

export type BlockBase = { id: string; sourceRefs: SourceRef[]; sourceType?: SourceType };
export type TeachingNoteBlock = BlockBase & {
  type: "teaching-note";
  title: string;
  body: string;
  teaching?: { concept?: string; examMove?: string; trap?: string; useWhen?: string };
};
export type FormulaSymbol = { latex: string; meaning: string };
export type FormulaBlock = BlockBase & {
  type: "formula";
  name: string;
  purpose: string;
  latex: string;
  explanation?: string;
  symbols?: FormulaSymbol[];
};
export type WorkedExampleBlock = BlockBase & { type: "worked-example"; title: string; steps: string[]; answer?: string };
export type CriticalQuestionBlock = BlockBase & { type: "critical-question"; prompt: string; answer?: string };
export type LessonBlock = TeachingNoteBlock | FormulaBlock | WorkedExampleBlock | CriticalQuestionBlock;
export type QuestionType = "mcq" | "short" | "derivation" | "calculation";
export type Difficulty = "easy" | "medium" | "hard";
export type LabType = "compare" | "derivation-trace" | "deep-dive" | "decision-tree" | "geometry" | "concept-map" | "math-stepper" | "algorithm-trace" | "event-timeline" | "pipeline-builder";
export type Assessment = { id: string; courseCode: string; title: string; kind: string; weight?: number; date?: string | null; checklist: string[]; source?: SourceRef };
export type LabSummary = { id: string; courseCode: string; lessonId: string; title: string; type: LabType };
export type Lab = LabSummary & { sourceRefs?: SourceRef[]; sourceLens?: { whyExaminable?: string; lectureScope?: string; exerciseDepth?: string }; exercises?: Array<{ id?: string; title?: string; prompt?: string; steps?: string[] }> };
export type SlideSet = { id: string; courseId: string; lessonIds: string[]; source: { sourceId: string; sourceType: "lecture"; pageCount: number }; slides: Array<{ slideId: string; slideNumber: number; pdfPage: number; sourceRef: SourceRef; explanation: { whatYouSee: string; whyItMatters: string; intuition: string; technicalDetail: string; pitfall: string; connection: string }; socraticQuestions: Array<{ type: string; prompt: string; answer: string; hint: string }> }> };
export type TextbookIndex = { schemaVersion: "nus.textbook-index.v1"; courseId: string; source: SourceRef; pageCount: number; chapters: Array<{ id: string; number: string; title: string; pageStart: number; pageEnd: number; sections: Array<{ id: string; number: string; title: string; pageStart: number; pageEnd: number; sourceRef: SourceRef }> }>; reader?: { pdfUrl?: string; localPath?: string } };
export type Question = {
  id: string;
  entityKey: EntityKey;
  courseId: string;
  lessonId: string;
  type: QuestionType;
  difficulty: Difficulty;
  skill: string;
  cognitiveLevel: string;
  estimatedSeconds: number;
  prompt: string;
  choices?: string[];
  answer?: number;
  accepted?: string[];
  rubric?: Array<{ label: string; required: string[] }>;
  solution?: string;
  explanation: string;
  hint?: string;
  misconception: string;
  visualHook: string;
  sourceRefs: SourceRef[];
};
export type StudyKit = {
  lessonId: string;
  schemaVersion: "nus.study-kit.v1";
  flashcards: Array<{ id?: string; front?: string; back?: string; sourceRefs?: SourceRef[] }>;
  homework: Array<{ id?: string; title?: string; prompt?: string; sourceRefs?: SourceRef[] }>;
  codeExercises: Array<{ id?: string; title?: string; prompt?: string; sourceRefs?: SourceRef[] }>;
};
export type Lesson = {
  id: string;
  entityKey: EntityKey;
  courseId: string;
  moduleId: string;
  title: string;
  week?: number;
  minutes?: number;
  summary?: string;
  objectives?: string[];
  sections?: Array<{ title: string; body: string; teaching?: TeachingNoteBlock["teaching"]; sourceRefs?: SourceRef[] }>;
  math?: Array<{ name: string; purpose: string; latex: string; explanation?: string; symbols?: FormulaSymbol[]; sourceRefs?: SourceRef[] }>;
  examples?: Array<{ title: string; steps: string[]; answer?: string; sourceRefs?: SourceRef[] }>;
  blocks: LessonBlock[];
  sourceRefs: SourceRef[];
  questionIds: string[];
  labIds: string[];
  visualIds: string[];
  slideSetIds: string[];
  schemaVersion: "nus.lesson.v1";
};
export type LessonOutline = {
  id: string;
  entityKey: EntityKey;
  title: string;
  courseId: string;
  moduleId: string;
  week?: number;
  minutes?: number;
  summary?: string;
  objectiveCount?: number;
  questionCount?: number;
  questionIds: string[];
  labIds: string[];
  visualIds: string[];
  slideSetIds: string[];
  hasVisualLab?: boolean;
  schemaVersion: "nus.lesson-outline.v1";
};
export type Course = {
  code: string;
  entityKey: EntityKey;
  title: string;
  semester?: string;
  description?: string;
  color?: string;
  department?: string;
  faculty?: string;
  prerequisites?: string[];
  workload?: string[];
  nusmods?: { url: string };
  moduleIds: string[];
  assessmentIds: string[];
  slideSetIds: string[];
  sourceCatalog: SourceRef[];
  sourcePolicy: Record<string, string>;
  schemaVersion: "nus.course.v1";
};
export type CourseSummary = Pick<Course, "code" | "entityKey" | "title" | "semester" | "schemaVersion"> & { description?: string; lessonCount?: number; questionCount?: number };
export type CourseOutline = {
  courseId: string;
  entityKey: EntityKey;
  course: CourseSummary;
  modules: Array<{ id: string; entityKey: EntityKey; title: string; lessonIds: string[]; lessons: LessonOutline[] }>;
  labs: LabSummary[];
  schemaVersion: "nus.course-outline.v1";
};
export type CoursePackage = {
  course: Course;
  outline: CourseOutline;
  content: { modules: CourseOutline["modules"] };
  assessments: Assessment[];
  lessonAssets: Record<string, string>;
  questionAssets: Record<string, string>;
  studyKitAssets: Record<string, string>;
  labAssets: Record<string, string>;
  visualAssets: Record<string, string>;
  slideAssets: Record<string, string>;
  textbookAsset?: string;
  sourceManifestAsset?: string;
  schemaVersion: "nus.course-payload.v1";
};
export type LessonPayload = Lesson & StudyKit & { questions: Question[] };
export type ContentRepository = {
  listCourses(): CourseSummary[];
  peekCourse(courseId: string): CourseSummary | null;
  getCourseOutline(courseId: string): Promise<CourseOutline | null>;
  listLessons(courseId: string): LessonOutline[];
  peekLesson(courseId: string, lessonId: string): Lesson | LessonOutline | null;
  getLesson(courseId: string, lessonId: string): Promise<LessonPayload | null>;
  loadCourse(courseId: string): Promise<CoursePackage | null>;
  loadLesson(courseId: string, lessonId: string): Promise<LessonPayload | null>;
  getQuestions(courseId: string, lessonId: string): Promise<Question[]>;
  getStudyKit(courseId: string, lessonId: string): Promise<StudyKit | null>;
  loadSlides(courseId: string): Promise<SlideSet[]>;
  loadTextbook(courseId: string): Promise<TextbookIndex | null>;
  getAssessment(courseId: string): Assessment[];
  getLab(labId: string): Lab | null;
  needsLoad(courseId: string): boolean;
  isLessonLoaded(courseId: string, lessonId: string): boolean;
};
export const CONTENT_SCHEMA_VERSIONS = {
  course: "nus.course.v1", courseOutline: "nus.course-outline.v1", coursePayload: "nus.course-payload.v1",
  lesson: "nus.lesson.v1", lessonOutline: "nus.lesson-outline.v1", question: "nus.question.v1", studyKit: "nus.study-kit.v1"
} as const;
export function isLessonBlock(value: unknown): value is LessonBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as { type?: unknown; id?: unknown; sourceRefs?: unknown };
  return typeof block.type === "string" && ["teaching-note", "formula", "worked-example", "critical-question"].includes(block.type) && typeof block.id === "string" && Array.isArray(block.sourceRefs);
}
export function isLesson(value: unknown): value is Lesson {
  if (!value || typeof value !== "object") return false;
  const lesson = value as Partial<Lesson>;
  return typeof lesson.id === "string" && typeof lesson.entityKey === "string" && typeof lesson.courseId === "string" && typeof lesson.moduleId === "string" && lesson.schemaVersion === CONTENT_SCHEMA_VERSIONS.lesson && Array.isArray(lesson.blocks) && lesson.blocks.every(isLessonBlock) && Array.isArray(lesson.sourceRefs) && Array.isArray(lesson.questionIds) && Array.isArray(lesson.labIds) && Array.isArray(lesson.visualIds) && Array.isArray(lesson.slideSetIds);
}
export function assertNever(value: never): never { throw new Error(`Unhandled content variant: ${String(value)}`); }
