export type SourceType = "lecture" | "exercise" | "textbook" | "ref" | "assessment-derived";

export type SourceRef = {
  sourceId: string;
  sourceType?: SourceType;
  page: number;
  blockId?: string;
  blockType?: string;
  bbox?: [number, number, number, number];
  imageId?: string;
  role?: string;
  status?: string;
};

type BlockBase = {
  id?: string;
  sourceRefs?: SourceRef[];
  sourceType?: SourceType;
};

export type TeachingNoteBlock = BlockBase & {
  type: "teaching-note";
  title: string;
  body: string;
  teaching?: {
    concept?: string;
    examMove?: string;
    trap?: string;
    useWhen?: string;
  };
};

export type FormulaBlock = BlockBase & {
  type: "formula";
  name: string;
  purpose: string;
  latex: string;
  explanation?: string;
  symbols?: Array<{ latex: string; meaning: string }>;
};

export type WorkedExampleBlock = BlockBase & {
  type: "worked-example";
  title: string;
  steps: string[];
  answer?: string;
};

export type CriticalQuestionBlock = BlockBase & {
  type: "critical-question";
  prompt: string;
  answer?: string;
};

export type LessonBlock = TeachingNoteBlock | FormulaBlock | WorkedExampleBlock | CriticalQuestionBlock;

export type Question = {
  id: string;
  type: "mcq" | "short" | "derivation" | "calculation" | string;
  prompt: string;
  explanation?: string;
  sourceRefs?: SourceRef[];
  [key: string]: unknown;
};

export type StudyKit = {
  lessonId: string;
  schemaVersion: "nus.study-kit.v1";
  flashcards: Array<Record<string, unknown>>;
  homework: Array<Record<string, unknown>>;
  codeExercises: Array<Record<string, unknown>>;
};

export type Lesson = {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  blocks: LessonBlock[];
  sourceRefs: SourceRef[];
  questionIds: string[];
  labIds: string[];
  schemaVersion: "nus.lesson.v1";
  [key: string]: unknown;
};

export type LessonOutline = Pick<Lesson, "id" | "title" | "courseId" | "moduleId"> & {
  week?: number;
  minutes?: number;
  summary?: string;
  objectiveCount?: number;
  questionCount?: number;
  questionIds: string[];
  labIds?: string[];
  visualIds?: string[];
  hasVisualLab?: boolean;
  schemaVersion: "nus.lesson-outline.v1";
};

export type Course = {
  code: string;
  title: string;
  semester?: string;
  schemaVersion: "nus.course.v1";
  [key: string]: unknown;
};

export type CourseSummary = Pick<Course, "code" | "title" | "semester" | "schemaVersion"> & {
  description?: string;
  lessonCount?: number;
  questionCount?: number;
};

export type CourseOutline = {
  courseId: string;
  course: CourseSummary;
  modules: Array<{
    id: string;
    title: string;
    lessons: LessonOutline[];
  }>;
  labs?: Array<Record<string, unknown>>;
  schemaVersion: "nus.course-outline.v1";
};

export type CoursePackage = {
  course: Course;
  outline: CourseOutline;
  content: { modules: CourseOutline["modules"] };
  assessments: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type LessonPayload = Lesson & StudyKit & {
  questions: Question[];
};

export type ContentRepository = {
  listCourses(): CourseSummary[];
  getCourse(courseId: string): CourseSummary | null;
  getCourseOutline(courseId: string): CourseOutline | null;
  listLessons(courseId: string): LessonOutline[];
  getLesson(courseId: string, lessonId: string): Lesson | LessonOutline | null;
  loadCourse(courseId: string): Promise<CoursePackage | null>;
  loadLesson(courseId: string, lessonId: string): Promise<LessonPayload | null>;
  getQuestions(courseId: string, lessonId: string): Promise<Question[]>;
  getStudyKit(courseId: string, lessonId: string): Promise<StudyKit | null>;
  getAssessment(courseId: string): Array<Record<string, unknown>>;
  getLab(labId: string): Record<string, unknown> | null;
  needsLoad(courseId: string): boolean;
  isLessonLoaded(courseId: string, lessonId: string): boolean;
};

export const CONTENT_SCHEMA_VERSIONS = {
  course: "nus.course.v1",
  courseOutline: "nus.course-outline.v1",
  lesson: "nus.lesson.v1",
  lessonOutline: "nus.lesson-outline.v1",
  question: "nus.question.v1",
  studyKit: "nus.study-kit.v1"
} as const;

export function isLessonBlock(value: unknown): value is LessonBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Partial<LessonBlock>;
  return typeof block.type === "string"
    && ["teaching-note", "formula", "worked-example", "critical-question"].includes(block.type)
    && (!block.sourceRefs || Array.isArray(block.sourceRefs));
}

export function isLesson(value: unknown): value is Lesson {
  if (!value || typeof value !== "object") return false;
  const lesson = value as Partial<Lesson>;
  return typeof lesson.id === "string"
    && typeof lesson.courseId === "string"
    && typeof lesson.moduleId === "string"
    && lesson.schemaVersion === CONTENT_SCHEMA_VERSIONS.lesson
    && Array.isArray(lesson.blocks)
    && lesson.blocks.every(isLessonBlock)
    && Array.isArray(lesson.sourceRefs)
    && Array.isArray(lesson.questionIds)
    && Array.isArray(lesson.labIds);
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled content variant: ${String(value)}`);
}
