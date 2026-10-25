import { compareTerms, isTermKey, type Course, type PublishStatus, type ReviewMaterial, type ReviewSessionDetail, type TermKey } from '@msc-web/content';
import {
  toCourse,
  toReviewMaterial,
  toReviewSession,
  type CourseRow,
  type ReviewMaterialRow,
  type ReviewSessionRow,
} from '../rows/reviews';

/**
 * Read queries behind the public test review pages. Only published sessions of visible courses ever leave the
 * database; hiding a course takes its sessions and materials off the site at once.
 * 公开考前复习页面背后的读取查询。只有设为显示的课程中已发布的场次会被读出数据库；隐藏一门课程会让其场次与资料同时从网站上消失。
 */

const PUBLISHED: PublishStatus = 'published';

/** Midterm before final, then by start time with undated sessions last. */
/** 先期中后期末，再按开始时间排列，未定时间的场次排在最后。 */
const SESSION_ORDER = "CASE s.exam WHEN 'midterm' THEN 0 ELSE 1 END, s.starts_at IS NULL, s.starts_at, s.created_at, s.id";

const MATERIAL_ORDER = 'm.sort_order, m.created_at, m.id';

export interface CourseReviews {
  course: Course;
  sessions: ReviewSessionDetail[];
}

function withMaterials(sessionRows: ReviewSessionRow[], materialRows: ReviewMaterialRow[]): ReviewSessionDetail[] {
  const bySession = new Map<string, ReviewMaterial[]>();
  for (const material of materialRows.map(toReviewMaterial)) {
    const list = bySession.get(material.sessionId) ?? [];
    list.push(material);
    bySession.set(material.sessionId, list);
  }
  return sessionRows.map((row) => {
    const session = toReviewSession(row);
    return { ...session, materials: bySession.get(session.id) ?? [] };
  });
}

/** Terms that have published sessions of visible courses, newest first. */
/** 拥有可见课程已发布场次的学期，按从新到旧排列。 */
export async function listPublishedTerms(db: D1Database): Promise<TermKey[]> {
  const { results } = await db
    .prepare(
      `SELECT DISTINCT s.term FROM review_sessions s JOIN courses c ON c.id = s.course_id
       WHERE s.status = ? AND c.visible = 1`,
    )
    .bind(PUBLISHED)
    .all<{ term: string }>();
  return results
    .map((row) => row.term)
    .filter(isTermKey)
    .sort((a, b) => compareTerms(b, a));
}

/**
 * Visible courses with published sessions in a term, by sort order then code, each with those sessions and their
 * materials. The three reads filter on the term itself rather than on a list of ids, so no statement grows with
 * the number of courses.
 * 某学期拥有已发布场次的可见课程，按排序值再按课程代码排列，每门课附带这些场次及其资料。三次读取都直接按学期筛选，
 * 而不是按 id 列表筛选，因此语句长度不会随课程数量增长。
 */
export async function listTermCourseReviews(db: D1Database, term: TermKey): Promise<CourseReviews[]> {
  const [courses, sessions, materials] = await Promise.all([
    db
      .prepare(
        `SELECT c.* FROM courses c
         WHERE c.visible = 1 AND EXISTS (SELECT 1 FROM review_sessions s WHERE s.course_id = c.id AND s.status = ?1 AND s.term = ?2)
         ORDER BY c.sort_order, c.code`,
      )
      .bind(PUBLISHED, term)
      .all<CourseRow>(),
    db
      .prepare(
        `SELECT s.* FROM review_sessions s JOIN courses c ON c.id = s.course_id
         WHERE s.status = ?1 AND s.term = ?2 AND c.visible = 1
         ORDER BY ${SESSION_ORDER}`,
      )
      .bind(PUBLISHED, term)
      .all<ReviewSessionRow>(),
    db
      .prepare(
        `SELECT m.* FROM review_materials m
         JOIN review_sessions s ON s.id = m.session_id
         JOIN courses c ON c.id = s.course_id
         WHERE s.status = ?1 AND s.term = ?2 AND c.visible = 1
         ORDER BY ${MATERIAL_ORDER}`,
      )
      .bind(PUBLISHED, term)
      .all<ReviewMaterialRow>(),
  ]);
  const details = withMaterials(sessions.results, materials.results);
  return courses.results.map(toCourse).map((course) => ({ course, sessions: details.filter((session) => session.courseId === course.id) }));
}

/** Visible courses with at least one published session in any term, by sort order then code. */
/** 在任一学期至少有一场已发布复习的可见课程，按排序值再按课程代码排列。 */
export async function listReviewedCourses(db: D1Database): Promise<Course[]> {
  const { results } = await db
    .prepare(
      `SELECT c.* FROM courses c
       WHERE c.visible = 1 AND EXISTS (SELECT 1 FROM review_sessions s WHERE s.course_id = c.id AND s.status = ?)
       ORDER BY c.sort_order, c.code`,
    )
    .bind(PUBLISHED)
    .all<CourseRow>();
  return results.map(toCourse);
}

/** A visible course by its code in capitals; null for hidden or unknown courses. */
/** 按大写课程代码查找可见课程；隐藏或不存在的课程返回 null。 */
export async function findVisibleCourse(db: D1Database, code: string): Promise<Course | null> {
  const row = await db.prepare('SELECT * FROM courses WHERE code = ? AND visible = 1').bind(code).first<CourseRow>();
  return row ? toCourse(row) : null;
}

/** Every published session of a course across all terms, with materials, in the order of SESSION_ORDER. */
/** 一门课程在所有学期中的全部已发布场次及其资料，按 SESSION_ORDER 排列。 */
export async function listCourseSessions(db: D1Database, courseId: string): Promise<ReviewSessionDetail[]> {
  const [sessions, materials] = await Promise.all([
    db
      .prepare(`SELECT s.* FROM review_sessions s WHERE s.course_id = ? AND s.status = ? ORDER BY ${SESSION_ORDER}`)
      .bind(courseId, PUBLISHED)
      .all<ReviewSessionRow>(),
    db
      .prepare(
        `SELECT m.* FROM review_materials m JOIN review_sessions s ON s.id = m.session_id
         WHERE s.course_id = ? AND s.status = ?
         ORDER BY ${MATERIAL_ORDER}`,
      )
      .bind(courseId, PUBLISHED)
      .all<ReviewMaterialRow>(),
  ]);
  return withMaterials(sessions.results, materials.results);
}

export interface CourseLink {
  code: string;
  /** The later of the course's own update and its newest published session update. */
  /** 课程自身更新时间与其最新已发布场次更新时间中较晚的一个。 */
  updatedAt: string;
}

/** Every course page the sitemap lists: visible courses with a published session. */
/** 站点地图列出的全部课程页面：拥有已发布场次的可见课程。 */
export async function listReviewedCourseLinks(db: D1Database): Promise<CourseLink[]> {
  const { results } = await db
    .prepare(
      `SELECT c.code, MAX(c.updated_at, MAX(s.updated_at)) AS updated_at
       FROM courses c JOIN review_sessions s ON s.course_id = c.id
       WHERE c.visible = 1 AND s.status = ?
       GROUP BY c.id
       ORDER BY c.sort_order, c.code`,
    )
    .bind(PUBLISHED)
    .all<{ code: string; updated_at: string }>();
  return results.map((row) => ({ code: row.code, updatedAt: row.updated_at }));
}
