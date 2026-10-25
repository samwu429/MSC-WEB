import {
  EXAM_KINDS,
  EXAM_KIND_LABELS,
  compareTerms,
  type AdminIdentity,
  type Course,
  type ExamKind,
  type ReviewMaterial,
  type ReviewSession,
  type ReviewSessionDetail,
  type ReviewSessionInput,
  type WallTime,
} from '@msc-web/content';
import { changeStatement } from './change-log';
import { newId, nextVersion, nowIso, versionedOutcome, type VersionedOutcome } from './records';
import { listMaterialsOfCourse, listMaterialsOfSession, materialFiles } from './review-materials';
import { toReviewSession, type ReviewSessionRow } from './rows/reviews';

/**
 * Midterm and final review sessions of each course, per term. A session belongs to one course and goes with it by
 * ON DELETE CASCADE; its materials go with the session the same way.
 * 每门课程各学期的期中与期末复习场次。场次属于某一门课程，并通过 ON DELETE CASCADE 随之删除；场次的资料也以同样方式随场次删除。
 */

const TABLE = 'review_sessions';

/** Columns a save writes, in the order contentValues lists their values. */
/** 保存时写入的列，顺序与 contentValues 给出的值一致。 */
const CONTENT_COLUMNS = [
  'term',
  'exam',
  'status',
  'title_zh',
  'title_en',
  'starts_at',
  'ends_at',
  'mode',
  'location_zh',
  'location_en',
  'presenters',
  'registration_url',
  'recording_url',
  'notes_zh',
  'notes_en',
] as const;

const INSERT_SQL = `INSERT INTO review_sessions (id, course_id, ${CONTENT_COLUMNS.join(', ')}, created_at, updated_at)
  VALUES (${Array.from({ length: CONTENT_COLUMNS.length + 4 }, () => '?').join(', ')})`;

const UPDATE_SQL = `UPDATE review_sessions SET ${CONTENT_COLUMNS.map((column) => `${column} = ?`).join(', ')}, updated_at = ?
  WHERE id = ? AND updated_at = ? RETURNING *`;

function contentValues(input: ReviewSessionInput): (string | null)[] {
  return [
    input.term,
    input.exam,
    input.status,
    input.title.zh,
    input.title.en,
    input.startsAt,
    input.endsAt,
    input.mode,
    input.location.zh,
    input.location.en,
    input.presenters,
    input.registrationUrl,
    input.recordingUrl,
    input.notes.zh,
    input.notes.en,
  ];
}

/** A session with the code of its course, which is enough to name it and to check the version an editor loaded. */
/** 附带所属课程代码的复习场次，足以为其命名，并核对编辑者加载的版本。 */
export interface SessionReference {
  id: string;
  courseCode: string;
  exam: ExamKind;
  updatedAt: string;
}

interface SessionReferenceRow {
  id: string;
  course_code: string;
  exam: string;
  updated_at: string;
}

/** The change log name of a session: the course code and the exam label, such as "CSC108H5 期中复习". */
/** 修改记录中复习场次的名称：课程代码加复习类型，例如 "CSC108H5 期中复习"。 */
export function sessionSummary(session: Pick<SessionReference, 'courseCode' | 'exam'>): string {
  return `${session.courseCode} ${EXAM_KIND_LABELS[session.exam].zh}`;
}

function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Earlier start first; a session whose time is still being arranged comes after every scheduled one. */
/** 开始时间早的在前；时间尚在安排的场次排在所有已定时间的场次之后。 */
function compareStartTimes(a: WallTime | null, b: WallTime | null): number {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
  return compareText(a, b);
}

/**
 * The order of a course's sessions in the backend: newest term first, then by start time, then the midterm review
 * before the final review. Creation time and id settle the rest so the order never changes between loads.
 * 后台中一门课程各场次的顺序：最新的学期在前，其次按开始时间，再次期中复习排在期末复习之前。
 * 其余情况按创建时间与 id 排列，使每次加载的顺序保持不变。
 */
export function compareSessions(a: ReviewSession, b: ReviewSession): number {
  return (
    compareTerms(b.term, a.term) ||
    compareStartTimes(a.startsAt, b.startsAt) ||
    EXAM_KINDS.indexOf(a.exam) - EXAM_KINDS.indexOf(b.exam) ||
    compareText(a.createdAt, b.createdAt) ||
    compareText(a.id, b.id)
  );
}

function attachMaterials(sessions: readonly ReviewSession[], materials: readonly ReviewMaterial[]): ReviewSessionDetail[] {
  const bySession = new Map<string, ReviewMaterial[]>();
  for (const material of materials) {
    const list = bySession.get(material.sessionId);
    if (list) list.push(material);
    else bySession.set(material.sessionId, [material]);
  }
  return sessions.map((session) => ({ ...session, materials: bySession.get(session.id) ?? [] }));
}

/** Every session of a course with its materials, in backend order; materials are read for all sessions at once. */
/** 一门课程的全部场次及其资料，按后台顺序排列；所有场次的资料一次读出。 */
export async function listSessionDetailsOfCourse(db: D1Database, courseId: string): Promise<ReviewSessionDetail[]> {
  const [sessions, materials] = await Promise.all([
    db.prepare('SELECT * FROM review_sessions WHERE course_id = ?').bind(courseId).all<ReviewSessionRow>(),
    listMaterialsOfCourse(db, courseId),
  ]);
  return attachMaterials(sessions.results.map(toReviewSession).sort(compareSessions), materials);
}

export async function findSessionDetail(db: D1Database, id: string): Promise<ReviewSessionDetail | null> {
  const row = await db.prepare('SELECT * FROM review_sessions WHERE id = ?').bind(id).first<ReviewSessionRow>();
  if (!row) return null;
  return { ...toReviewSession(row), materials: await listMaterialsOfSession(db, id) };
}

export async function findSessionReference(db: D1Database, id: string): Promise<SessionReference | null> {
  const row = await db
    .prepare('SELECT s.id, s.exam, s.updated_at, c.code AS course_code FROM review_sessions s JOIN courses c ON c.id = s.course_id WHERE s.id = ?')
    .bind(id)
    .first<SessionReferenceRow>();
  return row ? { id: row.id, courseCode: row.course_code, exam: row.exam as ExamKind, updatedAt: row.updated_at } : null;
}

export async function createSession(
  db: D1Database,
  identity: AdminIdentity,
  course: Pick<Course, 'id' | 'code'>,
  input: ReviewSessionInput,
): Promise<ReviewSession> {
  const id = newId('rvs');
  const now = nowIso();
  const summary = sessionSummary({ courseCode: course.code, exam: input.exam });
  await db.batch([
    db.prepare(INSERT_SQL).bind(id, course.id, ...contentValues(input), now, now),
    changeStatement(db, identity, { action: 'create', entity: 'review_session', entityId: id, summary }),
  ]);
  return { id, courseId: course.id, ...input, createdAt: now, updatedAt: now };
}

export type SessionUpdate = { outcome: 'updated'; session: ReviewSession } | { outcome: Exclude<VersionedOutcome, 'updated'> };

/**
 * Saves over the version the editor loaded. The version is compared before the write so that a stale save leaves no
 * change log entry; the conditional UPDATE still decides when two saves race.
 * 在编辑者加载的版本之上保存。写入前先比较版本，过期的保存因此不会留下修改记录；两次保存同时发生时仍由带条件的 UPDATE 决定结果。
 */
export async function updateSession(
  db: D1Database,
  identity: AdminIdentity,
  id: string,
  input: ReviewSessionInput,
  expectedUpdatedAt: string,
): Promise<SessionUpdate> {
  const stored = await findSessionReference(db, id);
  if (!stored) return { outcome: 'missing' };
  if (stored.updatedAt !== expectedUpdatedAt) return { outcome: 'stale' };
  const summary = sessionSummary({ courseCode: stored.courseCode, exam: input.exam });
  const [update] = await db.batch<ReviewSessionRow>([
    db.prepare(UPDATE_SQL).bind(...contentValues(input), nextVersion(expectedUpdatedAt), id, expectedUpdatedAt),
    changeStatement(db, identity, { action: 'update', entity: 'review_session', entityId: id, summary }),
  ]);
  const row = update?.results[0];
  if (row) return { outcome: 'updated', session: toReviewSession(row) };
  return { outcome: (await versionedOutcome(db, TABLE, id, 0)) === 'missing' ? 'missing' : 'stale' };
}

/** Deletes a session with its materials and returns the files those materials used; null when there was no session. */
/** 删除一场复习及其资料，并返回这些资料所用的文件；场次不存在时返回 null。 */
export async function deleteSession(db: D1Database, identity: AdminIdentity, id: string): Promise<string[] | null> {
  const session = await findSessionReference(db, id);
  if (!session) return null;
  const files = materialFiles(await listMaterialsOfSession(db, id));
  await db.batch([
    db.prepare('DELETE FROM review_sessions WHERE id = ?').bind(id),
    changeStatement(db, identity, { action: 'delete', entity: 'review_session', entityId: id, summary: sessionSummary(session) }),
  ]);
  return files;
}
