export type SourceType = "lecture" | "textbook" | "ref" | "assessment-derived";

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

export type LessonBlock = {
  type: string;
  id?: string;
  text?: string;
  latex?: string;
  sourceRefs?: SourceRef[];
  [key: string]: unknown;
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

export type Course = {
  code: string;
  title: string;
  semester?: string;
  schemaVersion: "nus.course.v1";
  [key: string]: unknown;
};

export type ContentRepository = {
  getCourse(courseId: string): Course | null;
  getLesson(courseId: string, lessonId: string): Lesson | null;
  listLessons(courseId: string): Lesson[];
  getAssessment(courseId?: string): Record<string, unknown>[];
  getLab(labId: string): Record<string, unknown> | null;
};

export const CONTENT_SCHEMA_VERSIONS = {
  course: "nus.course.v1",
  lesson: "nus.lesson.v1",
  question: "nus.question.v1",
  studyKit: "nus.study-kit.v1"
} as const;

export function isLesson(value: unknown): value is Lesson {
  if (!value || typeof value !== "object") return false;
  const lesson = value as Partial<Lesson>;
  return typeof lesson.id === "string"
    && typeof lesson.courseId === "string"
    && typeof lesson.moduleId === "string"
    && lesson.schemaVersion === CONTENT_SCHEMA_VERSIONS.lesson
    && Array.isArray(lesson.blocks)
    && Array.isArray(lesson.sourceRefs)
    && Array.isArray(lesson.questionIds)
    && Array.isArray(lesson.labIds);
}
