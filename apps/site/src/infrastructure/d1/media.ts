import type { MediaKind, MediaRecord } from '@msc-web/content';
import type { MediaRow } from './rows/media';

/**
 * The media table: one row per uploaded file. Content tables reference it by foreign key, and settings refer to keys
 * inside their JSON. Rows are removed only by deletes that check every reference in the same statement, so a record
 * attached a moment earlier always keeps its file.
 * media 表：每个上传文件一行。内容表以外键引用它，设置则在 JSON 中引用键。删除记录时总在同一条语句中检查所有引用，
 * 因此片刻之前刚被引用的文件一定会被保留。
 */

/** Columns of the media table, in the order inserts list them. */
/** media 表的列，顺序与插入语句列出的顺序一致。 */
const MEDIA_COLUMNS = ['key', 'kind', 'content_type', 'size', 'width', 'height', 'file_name', 'uploaded_by', 'created_at'] as const;

export async function insertMedia(db: D1Database, record: MediaRecord, uploadedBy: string): Promise<void> {
  await db
    .prepare(`INSERT INTO media (${MEDIA_COLUMNS.join(', ')}) VALUES (${MEDIA_COLUMNS.map(() => '?').join(', ')})`)
    .bind(record.key, record.kind, record.contentType, record.size, record.width, record.height, record.fileName, uploadedBy, record.createdAt)
    .run();
}

/** Keys from the list that have no media row of the expected kind. */
/** 列表中没有对应类型媒体记录的键。 */
export async function missingMediaKeys(db: D1Database, keys: readonly string[], kind: MediaKind): Promise<string[]> {
  const unique = [...new Set(keys)];
  if (unique.length === 0) return [];
  const result = await db
    .prepare(`SELECT key FROM media WHERE kind = ? AND key IN (${unique.map(() => '?').join(', ')})`)
    .bind(kind, ...unique)
    .all<{ key: string }>();
  const found = new Set(result.results.map((row) => row.key));
  return unique.filter((key) => !found.has(key));
}

/**
 * Every place a media key can be used, as subqueries over a key expression. Both deletes are guarded by this one
 * list, so a new reference is added in one place. `key` is always one of the constant expressions below, never
 * request input.
 * 媒体键可能被使用的所有位置，写成针对某个键表达式的子查询。两种删除都由这一份列表把关，新增引用只需改一处。
 * `key` 总是下面的常量表达式之一，绝不是请求输入。
 */
function referenceQueries(key: 'media.key' | 'm.key'): string[] {
  return [
    `SELECT 1 FROM people WHERE photo_key = ${key}`,
    `SELECT 1 FROM events WHERE cover_key = ${key}`,
    `SELECT 1 FROM event_photos WHERE media_key = ${key}`,
    `SELECT 1 FROM review_materials WHERE media_key = ${key}`,
    `SELECT 1 FROM documents WHERE media_key = ${key}`,
    `SELECT 1 FROM settings WHERE instr(value, ${key}) > 0`,
  ];
}

function unreferenced(key: 'media.key' | 'm.key'): string {
  return referenceQueries(key)
    .map((query) => `NOT EXISTS (${query})`)
    .join(' AND ');
}

// The keys travel as one JSON array, so any number of them stays within D1's limit of 100 bound parameters.
// 键以一个 JSON 数组传入，因此无论有多少个键，都不会超出 D1 每条语句 100 个绑定参数的限制。
const DELETE_LISTED_SQL = `DELETE FROM media WHERE key IN (SELECT value FROM json_each(?1)) AND ${unreferenced('media.key')} RETURNING *`;

const DELETE_OLD_SQL = `DELETE FROM media WHERE key IN (
  SELECT m.key FROM media m WHERE m.created_at < ?1 AND ${unreferenced('m.key')} ORDER BY m.created_at, m.key LIMIT ?2
) RETURNING *`;

const RESTORE_SQL = `INSERT OR IGNORE INTO media (${MEDIA_COLUMNS.join(', ')})
  SELECT ${MEDIA_COLUMNS.map((column) => `json_extract(value, '$.${column}')`).join(', ')} FROM json_each(?1)`;

/**
 * Deletes the rows of the listed keys that nothing refers to, in one statement, and returns them as they were, so the
 * caller removes exactly those files and can put the rows back if that fails.
 * 在一条语句中删除列表中没有任何引用的键所对应的记录，并返回删除前的记录；调用方因此只移除这些文件，失败时还能把记录放回。
 */
export async function deleteUnreferencedMedia(db: D1Database, keys: readonly string[]): Promise<MediaRow[]> {
  if (keys.length === 0) return [];
  const result = await db.prepare(DELETE_LISTED_SQL).bind(JSON.stringify(keys)).all<MediaRow>();
  return result.results;
}

/**
 * Deletes up to `limit` uploads older than the cutoff that nothing refers to, oldest first, for the daily cleanup,
 * and returns them as they were. Files in use are left out before the limit applies, so however many there are,
 * they never crowd out the unused ones.
 * 删除最多 `limit` 个早于截止时间且没有任何引用的上传记录（从最早的开始），供每日清理使用，并返回删除前的记录。
 * 仍在使用的文件在应用数量上限之前就已排除，因此无论这类文件有多少，都不会挤占未使用文件的名额。
 */
export async function deleteUnreferencedMediaCreatedBefore(db: D1Database, cutoffIso: string, limit: number): Promise<MediaRow[]> {
  const result = await db.prepare(DELETE_OLD_SQL).bind(cutoffIso, limit).all<MediaRow>();
  return result.results;
}

/**
 * Puts deleted rows back, for files the bucket failed to remove, so the daily cleanup finds them again instead of
 * the files staying public with no row.
 * 把已删除的记录放回，用于存储桶未能移除的文件；每日清理因此会再次找到它们，而不是让这些文件在没有记录的情况下继续公开。
 */
export async function restoreMedia(db: D1Database, rows: readonly MediaRow[]): Promise<void> {
  if (rows.length === 0) return;
  await db.prepare(RESTORE_SQL).bind(JSON.stringify(rows)).run();
}
