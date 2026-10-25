import type { LocalizedText } from '../locale/locale';
import { IssueCollector, asRecord, type ValidationResult } from '../validation/issues';
import { readBoolean, readInteger, readLocalizedText } from '../validation/fields';

/**
 * A course the Academic Department runs reviews for. The code is the University course code in capitals, such as
 * CSC108H5, and the public address uses it in lowercase: /reviews/csc108h5.
 * 学术部开设复习的一门课程。代码为大写的学校课程代码，例如 CSC108H5；公开地址使用其小写形式：/reviews/csc108h5。
 */
export interface Course {
  id: string;
  code: string;
  title: LocalizedText;
  description: LocalizedText;
  sortOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CourseInput = Omit<Course, 'id' | 'createdAt' | 'updatedAt'>;

export const COURSE_LIMITS = {
  title: 120,
  description: 600,
} as const;

/** Three or four letters, three digits, then an optional suffix such as H5 or Y5. */
/** 三或四个字母、三位数字，然后是可选的后缀，例如 H5 或 Y5。 */
export const COURSE_CODE_PATTERN = /^[A-Z]{3,4}[0-9]{3}(?:[A-Z][0-9]?)?$/;

export function normalizeCourseCode(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

export function isCourseCode(value: unknown): value is string {
  return typeof value === 'string' && COURSE_CODE_PATTERN.test(value);
}

/** The lowercase path segment of a course page. */
/** 课程页面路径中的小写段。 */
export function courseSlug(code: string): string {
  return code.toLowerCase();
}

export function validateCourseInput(raw: unknown): ValidationResult<CourseInput> {
  const issues = new IssueCollector();
  const body = asRecord(raw);
  const code = typeof body.code === 'string' ? normalizeCourseCode(body.code) : '';
  if (!isCourseCode(code)) issues.add('code', '课程代码格式应类似 CSC108H5 或 MAT135');
  const value: CourseInput = {
    code,
    title: readLocalizedText(issues, body.title, 'title', { label: '课程名称', max: COURSE_LIMITS.title, required: true }),
    description: readLocalizedText(issues, body.description, 'description', { label: '课程说明', max: COURSE_LIMITS.description, multiline: true }),
    sortOrder: readInteger(issues, body.sortOrder, 'sortOrder', { label: '排序', min: 0, max: 9999, fallback: 0 }),
    visible: readBoolean(issues, body.visible, 'visible', '是否显示', true),
  };
  return issues.result(value);
}
