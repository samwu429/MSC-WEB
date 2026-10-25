import { emptyText, normalizeCourseCode, type Course, type CourseInput } from '@msc-web/content';

export function courseDraftOf(course: Course | null): CourseInput {
  if (!course) return { code: '', title: emptyText(), description: emptyText(), sortOrder: 0, visible: true };
  return { code: course.code, title: course.title, description: course.description, sortOrder: course.sortOrder, visible: course.visible };
}

/** The code is sent in the canonical form the server stores, such as CSC108H5 for "csc 108h5". */
/** 课程代码以服务器保存的规范形式发送，例如 "csc 108h5" 发送为 CSC108H5。 */
export function courseInputOf(draft: CourseInput): CourseInput {
  return { ...draft, code: normalizeCourseCode(draft.code) };
}
