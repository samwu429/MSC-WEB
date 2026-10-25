import { MATERIAL_LIMITS, materialLabel, pickText, type AdminIdentity, type ReviewMaterial, type ReviewMaterialInput } from '@msc-web/content';
import { changeStatement } from './change-log';
import { newId, nowIso } from './records';
import { toReviewMaterial, type ReviewMaterialRow } from './rows/reviews';

/**
 * Study materials of review sessions. A material belongs to one session and goes with it by ON DELETE CASCADE, so
 * whoever deletes a session or a course reads the material files first and releases them after the delete.
 * 复习场次的学习资料。资料属于某一场复习，并通过 ON DELETE CASCADE 随之删除；因此删除场次或课程时，需要先读出资料文件，删除后再释放。
 */

export const MAX_MATERIALS_PER_SESSION = MATERIAL_LIMITS.perSession;

/** The session a material is saved under, with the name the change log gives that session. */
/** 资料所属的复习场次，以及修改记录中该场次的名称。 */
export interface MaterialSession {
  id: string;
  summary: string;
}

/** Columns a save writes, in the order contentValues lists their values. */
/** 保存时写入的列，顺序与 contentValues 给出的值一致。 */
const CONTENT_COLUMNS = ['kind', 'label_zh', 'label_en', 'media_key', 'url', 'sort_order'] as const;

const INSERT_SQL = `INSERT INTO review_materials (id, session_id, ${CONTENT_COLUMNS.join(', ')}, created_at)
  VALUES (${Array.from({ length: CONTENT_COLUMNS.length + 3 }, () => '?').join(', ')})`;

const UPDATE_SQL = `UPDATE review_materials SET ${CONTENT_COLUMNS.map((column) => `${column} = ?`).join(', ')}
  WHERE id = ? AND session_id = ? RETURNING *`;

const MATERIAL_ORDER = 'ORDER BY m.sort_order, m.created_at, m.id';

function contentValues(input: ReviewMaterialInput): (string | number | null)[] {
  return [input.kind, input.label.zh, input.label.en, input.mediaKey, input.url, input.sortOrder];
}

/** The session name followed by the material name, such as "CSC108H5 期中复习 · 课件". */
/** 场次名称后接资料名称，例如 "CSC108H5 期中复习 · 课件"。 */
function changeSummary(session: MaterialSession, material: Pick<ReviewMaterialInput, 'kind' | 'label'>): string {
  return `${session.summary} · ${pickText(materialLabel(material), 'zh')}`;
}

/** The uploaded files among some materials; link materials have none. */
/** 一组资料中的上传文件；链接类资料没有文件。 */
export function materialFiles(materials: readonly ReviewMaterial[]): string[] {
  return materials.flatMap((material) => (material.mediaKey ? [material.mediaKey] : []));
}

export async function listMaterialsOfSession(db: D1Database, sessionId: string): Promise<ReviewMaterial[]> {
  const result = await db
    .prepare(`SELECT m.* FROM review_materials m WHERE m.session_id = ? ${MATERIAL_ORDER}`)
    .bind(sessionId)
    .all<ReviewMaterialRow>();
  return result.results.map(toReviewMaterial);
}

/** Materials of every session of a course, read in one query. */
/** 一门课程所有场次的资料，一次查询读出。 */
export async function listMaterialsOfCourse(db: D1Database, courseId: string): Promise<ReviewMaterial[]> {
  const result = await db
    .prepare(`SELECT m.* FROM review_materials m JOIN review_sessions s ON s.id = m.session_id WHERE s.course_id = ? ${MATERIAL_ORDER}`)
    .bind(courseId)
    .all<ReviewMaterialRow>();
  return result.results.map(toReviewMaterial);
}

export async function findMaterial(db: D1Database, sessionId: string, materialId: string): Promise<ReviewMaterial | null> {
  const row = await db
    .prepare('SELECT * FROM review_materials WHERE id = ? AND session_id = ?')
    .bind(materialId, sessionId)
    .first<ReviewMaterialRow>();
  return row ? toReviewMaterial(row) : null;
}

export async function countMaterials(db: D1Database, sessionId: string): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) AS total FROM review_materials WHERE session_id = ?').bind(sessionId).first<{ total: number }>();
  return row?.total ?? 0;
}

export async function createMaterial(
  db: D1Database,
  identity: AdminIdentity,
  session: MaterialSession,
  input: ReviewMaterialInput,
): Promise<ReviewMaterial> {
  const id = newId('mat');
  const now = nowIso();
  await db.batch([
    db.prepare(INSERT_SQL).bind(id, session.id, ...contentValues(input), now),
    changeStatement(db, identity, { action: 'create', entity: 'review_material', entityId: id, summary: changeSummary(session, input) }),
  ]);
  return { id, sessionId: session.id, ...input, createdAt: now };
}

export interface MaterialUpdate {
  material: ReviewMaterial;
  /** The file the material used before this save, so the caller can release it when it was replaced. */
  /** 本次保存之前资料所用的文件，供调用方在文件被替换时释放。 */
  previousMediaKey: string | null;
}

/** Saves a material of the session; null when the session has no material with that id. */
/** 保存该场次的一份资料；该场次没有此资料时返回 null。 */
export async function updateMaterial(
  db: D1Database,
  identity: AdminIdentity,
  session: MaterialSession,
  materialId: string,
  input: ReviewMaterialInput,
): Promise<MaterialUpdate | null> {
  const previous = await findMaterial(db, session.id, materialId);
  if (!previous) return null;
  const [update] = await db.batch<ReviewMaterialRow>([
    db.prepare(UPDATE_SQL).bind(...contentValues(input), materialId, session.id),
    changeStatement(db, identity, { action: 'update', entity: 'review_material', entityId: materialId, summary: changeSummary(session, input) }),
  ]);
  const row = update?.results[0];
  return row ? { material: toReviewMaterial(row), previousMediaKey: previous.mediaKey } : null;
}

/** Deletes a material of the session and returns it as it was, so the caller can release its file; null when there was none. */
/** 删除该场次的一份资料并返回删除前的记录，供调用方释放其文件；不存在时返回 null。 */
export async function deleteMaterial(
  db: D1Database,
  identity: AdminIdentity,
  session: MaterialSession,
  materialId: string,
): Promise<ReviewMaterial | null> {
  const material = await findMaterial(db, session.id, materialId);
  if (!material) return null;
  await db.batch([
    db.prepare('DELETE FROM review_materials WHERE id = ? AND session_id = ?').bind(materialId, session.id),
    changeStatement(db, identity, { action: 'delete', entity: 'review_material', entityId: materialId, summary: changeSummary(session, material) }),
  ]);
  return material;
}
