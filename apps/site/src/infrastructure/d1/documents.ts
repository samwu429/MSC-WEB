import { DOCUMENT_CATEGORIES, pickText, type AdminIdentity, type SiteDocument, type SiteDocumentInput } from '@msc-web/content';
import { changeStatement } from './change-log';
import { newId, nextVersion, nowIso, toFlag, versionedOutcome, type VersionedOutcome } from './records';
import { toSiteDocument, type DocumentRow } from './rows/documents';

/**
 * The documents table: the public records the constitution requires the site to carry. Reads return hidden
 * documents too, because the editing backend lists them all.
 * documents 表：章程要求网站公开的记录。读取时也返回隐藏的文件，因为编辑后台需要全部列出。
 */

const TABLE = 'documents';

/** Columns a save writes, in the order contentValues lists their values. */
/** 保存时写入的列，顺序与 contentValues 给出的值一致。 */
const CONTENT_COLUMNS = ['category', 'title_zh', 'title_en', 'media_key', 'published_on', 'visible', 'sort_order'] as const;

const INSERT_SQL = `INSERT INTO documents (id, ${CONTENT_COLUMNS.join(', ')}, created_at, updated_at)
  VALUES (${Array.from({ length: CONTENT_COLUMNS.length + 3 }, () => '?').join(', ')})`;

const UPDATE_SQL = `UPDATE documents SET ${CONTENT_COLUMNS.map((column) => `${column} = ?`).join(', ')}, updated_at = ?
  WHERE id = ? AND updated_at = ? RETURNING *`;

/** Categories in the order of DOCUMENT_CATEGORIES, bound as parameters; within one, the order the About page shows. */
/** 类别按 DOCUMENT_CATEGORIES 的顺序排列（类别值以参数绑定）；同一类别内的顺序与关于页面一致。 */
const LIST_SQL = `SELECT * FROM documents
  ORDER BY CASE category ${DOCUMENT_CATEGORIES.map((_, index) => `WHEN ? THEN ${index}`).join(' ')} ELSE ${DOCUMENT_CATEGORIES.length} END,
    sort_order, published_on DESC, created_at DESC`;

function contentValues(input: SiteDocumentInput): (string | number)[] {
  return [input.category, input.title.zh, input.title.en, input.mediaKey, input.publishedOn, toFlag(input.visible), input.sortOrder];
}

function changeSummary(document: Pick<SiteDocumentInput, 'title'>): string {
  return pickText(document.title, 'zh');
}

export async function listDocuments(db: D1Database): Promise<SiteDocument[]> {
  const result = await db
    .prepare(LIST_SQL)
    .bind(...DOCUMENT_CATEGORIES)
    .all<DocumentRow>();
  return result.results.map(toSiteDocument);
}

export async function findDocument(db: D1Database, id: string): Promise<SiteDocument | null> {
  const row = await db.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first<DocumentRow>();
  return row ? toSiteDocument(row) : null;
}

export async function createDocument(db: D1Database, identity: AdminIdentity, input: SiteDocumentInput): Promise<SiteDocument> {
  const id = newId('doc');
  const now = nowIso();
  await db.batch([
    db.prepare(INSERT_SQL).bind(id, ...contentValues(input), now, now),
    changeStatement(db, identity, { action: 'create', entity: 'document', entityId: id, summary: changeSummary(input) }),
  ]);
  return { id, ...input, createdAt: now, updatedAt: now };
}

export type DocumentUpdate = { outcome: 'updated'; document: SiteDocument } | { outcome: Exclude<VersionedOutcome, 'updated'> };

/** Saves over the version the editor loaded; any other stored version leaves the row untouched. */
/** 在编辑者加载的版本之上保存；库中为其他版本时不修改该行。 */
export async function updateDocument(
  db: D1Database,
  identity: AdminIdentity,
  id: string,
  input: SiteDocumentInput,
  expectedUpdatedAt: string,
): Promise<DocumentUpdate> {
  const [update] = await db.batch<DocumentRow>([
    db.prepare(UPDATE_SQL).bind(...contentValues(input), nextVersion(expectedUpdatedAt), id, expectedUpdatedAt),
    changeStatement(db, identity, { action: 'update', entity: 'document', entityId: id, summary: changeSummary(input) }),
  ]);
  const row = update?.results[0];
  if (row) return { outcome: 'updated', document: toSiteDocument(row) };
  return { outcome: (await versionedOutcome(db, TABLE, id, 0)) === 'missing' ? 'missing' : 'stale' };
}

/** Deletes a document and returns it as it was, so the caller can release its file; null when there was none. */
/** 删除一份文件记录并返回删除前的内容，供调用方释放其文件；不存在时返回 null。 */
export async function deleteDocument(db: D1Database, identity: AdminIdentity, id: string): Promise<SiteDocument | null> {
  const document = await findDocument(db, id);
  if (!document) return null;
  const [deleted] = await db.batch([
    db.prepare('DELETE FROM documents WHERE id = ?').bind(id),
    changeStatement(db, identity, { action: 'delete', entity: 'document', entityId: id, summary: changeSummary(document) }),
  ]);
  return (deleted?.meta.changes ?? 0) > 0 ? document : null;
}
