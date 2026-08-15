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

export type ContentRepository = {
  getCourse(courseId: string): Record<string, unknown> | null;
  getLesson(courseId: string, lessonId: string): Lesson | null;
  listLessons(courseId: string): Lesson[];
  getAssessment(courseId?: string): Record<string, unknown>[];
  getLab(labId: string): Record<string, unknown> | null;
};
