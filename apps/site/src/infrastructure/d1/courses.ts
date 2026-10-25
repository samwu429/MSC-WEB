import { pickText, type AdminIdentity, type Course, type CourseInput, type CourseSummary, type PublishStatus } from '@msc-web/content';
import { changeStatement } from './change-log';
import { newId, nextVersion, nowIso, toFlag, versionedOutcome, type VersionedOutcome } from './records';
import { listMaterialsOfCourse, materialFiles } from './review-materials';
import { toCourse, type CourseRow } from './rows/reviews';

/**
 * The courses table of the test review section. Reads return every course, hidden ones included, because the
 * editing backend lists them all; the public pages filter by visibility themselves.
 * 考前复习板块的 courses 表。读取会返回所有课程（包括隐藏的课程），因为编辑后台需要全部列出；公开页面自行按是否显示筛选。
 */

const TABLE = 'courses';

const PUBLISHED: PublishStatus = 'published';

/** Columns a save writes, in the order contentValues lists their values. */
/** 保存时写入的列，顺序与 contentValues 给出的值一致。 */
const CONTENT_COLUMNS = ['code', 'title_zh', 'title_en', 'description_zh', 'description_en', 'sort_order', 'visible'] as const;

const INSERT_SQL = `INSERT INTO courses (id, ${CONTENT_COLUMNS.join(', ')}, created_at, updated_at)
  VALUES (${Array.from({ length: CONTENT_COLUMNS.length + 3 }, () => '?').join(', ')})`;

const UPDATE_SQL = `UPDATE courses SET ${CONTENT_COLUMNS.map((column) => `${column} = ?`).join(', ')}, updated_at = ?
  WHERE id = ? AND updated_at = ? RETURNING *`;

const SUMMARY_SQL = `SELECT c.*, COUNT(s.id) AS session_count, COUNT(CASE WHEN s.status = ? THEN 1 END) AS published_session_count
  FROM courses c LEFT JOIN review_sessions s ON s.course_id = c.id
  GROUP BY c.id
  ORDER BY c.sort_order, c.code`;

interface CourseSummaryRow extends CourseRow {
  session_count: number;
  published_session_count: number;
}

function contentValues(input: CourseInput): (string | number)[] {
  return [input.code, input.title.zh, input.title.en, input.description.zh, input.description.en, input.sortOrder, toFlag(input.visible)];
}

function changeSummary(course: Pick<CourseInput, 'title'>): string {
  return pickText(course.title, 'zh');
}

/** Every course with its session counts, by sort order and then code, in one grouped query. */
/** 所有课程及其场次数量，按排序值再按课程代码排列，以一次分组查询读出。 */
export async function listCourseSummaries(db: D1Database): Promise<CourseSummary[]> {
  const result = await db.prepare(SUMMARY_SQL).bind(PUBLISHED).all<CourseSummaryRow>();
  return result.results.map((row) => ({ ...toCourse(row), sessionCount: row.session_count, publishedSessionCount: row.published_session_count }));
}

export async function findCourse(db: D1Database, id: string): Promise<Course | null> {
  const row = await db.prepare('SELECT * FROM courses WHERE id = ?').bind(id).first<CourseRow>();
  return row ? toCourse(row) : null;
}

/** Whether a course other than `exceptId` already uses the code. */
/** 除 `exceptId` 以外是否已有课程使用该代码。 */
export async function isCourseCodeTaken(db: D1Database, code: string, exceptId: string | null): Promise<boolean> {
  return (await db.prepare('SELECT 1 AS taken FROM courses WHERE code = ? AND id IS NOT ?').bind(code, exceptId).first()) !== null;
}

export async function createCourse(db: D1Database, identity: AdminIdentity, input: CourseInput): Promise<Course> {
  const id = newId('crs');
  const now = nowIso();
  await db.batch([
    db.prepare(INSERT_SQL).bind(id, ...contentValues(input), now, now),
    changeStatement(db, identity, { action: 'create', entity: 'course', entityId: id, summary: changeSummary(input) }),
  ]);
  return { id, ...input, createdAt: now, updatedAt: now };
}

export type CourseUpdate = { outcome: 'updated'; course: Course } | { outcome: Exclude<VersionedOutcome, 'updated'> };

/**
 * Saves over the version the editor loaded. The version is compared before the write so that a stale save leaves no
 * change log entry; the conditional UPDATE still decides when two saves race.
 * 在编辑者加载的版本之上保存。写入前先比较版本，过期的保存因此不会留下修改记录；两次保存同时发生时仍由带条件的 UPDATE 决定结果。
 */
export async function updateCourse(
  db: D1Database,
  identity: AdminIdentity,
  id: string,
  input: CourseInput,
  expectedUpdatedAt: string,
): Promise<CourseUpdate> {
  const stored = await db.prepare('SELECT updated_at FROM courses WHERE id = ?').bind(id).first<{ updated_at: string }>();
  if (!stored) return { outcome: 'missing' };
  if (stored.updated_at !== expectedUpdatedAt) return { outcome: 'stale' };
  const [update] = await db.batch<CourseRow>([
    db.prepare(UPDATE_SQL).bind(...contentValues(input), nextVersion(expectedUpdatedAt), id, expectedUpdatedAt),
    changeStatement(db, identity, { action: 'update', entity: 'course', entityId: id, summary: changeSummary(input) }),
  ]);
  const row = update?.results[0];
  if (row) return { outcome: 'updated', course: toCourse(row) };
  return { outcome: (await versionedOutcome(db, TABLE, id, 0)) === 'missing' ? 'missing' : 'stale' };
}

/**
 * Deletes a course; its sessions and their materials go with it by ON DELETE CASCADE. Returns the files those
 * materials used, read before the delete, or null when there was no course.
 * 删除一门课程；其场次与资料通过 ON DELETE CASCADE 一并删除。返回删除前读出的资料文件；课程不存在时返回 null。
 */
export async function deleteCourse(db: D1Database, identity: AdminIdentity, id: string): Promise<string[] | null> {
  const course = await findCourse(db, id);
  if (!course) return null;
  const files = materialFiles(await listMaterialsOfCourse(db, id));
  await db.batch([
    db.prepare('DELETE FROM courses WHERE id = ?').bind(id),
    changeStatement(db, identity, { action: 'delete', entity: 'course', entityId: id, summary: changeSummary(course) }),
  ]);
  return files;
}
