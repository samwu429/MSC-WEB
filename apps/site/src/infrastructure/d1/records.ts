/**
 * Small helpers every D1 repository shares: identifiers, timestamps, booleans, and the optimistic-concurrency check.
 * 所有 D1 仓储共用的小工具：标识符、时间戳、布尔值以及乐观并发检查。
 */

/** A prefixed random identifier such as evt_3f2a... (32 hex characters after the prefix). */
/** 带前缀的随机标识符，例如 evt_3f2a...（前缀后为 32 位十六进制字符）。 */
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * The updatedAt for a save that replaces `previous`. It is always later than `previous`, so two saves within the
 * same millisecond still produce different versions and the second editor gets a conflict instead of a silent win.
 * 替换 `previous` 的保存所使用的 updatedAt。它总是晚于 `previous`，因此同一毫秒内的两次保存也会产生不同的版本，
 * 第二位编辑者会收到冲突提示，而不是悄无声息地覆盖。
 */
export function nextVersion(previous: string | null, now: Date = new Date()): string {
  if (!previous) return now.toISOString();
  const last = Date.parse(previous);
  if (Number.isNaN(last) || now.getTime() > last) return now.toISOString();
  return new Date(last + 1).toISOString();
}

export function toFlag(value: boolean): number {
  return value ? 1 : 0;
}

export function fromFlag(value: unknown): boolean {
  return value === 1 || value === true;
}

/** The outcome of an UPDATE ... WHERE id = ? AND updated_at = ?. */
/** UPDATE ... WHERE id = ? AND updated_at = ? 的结果。 */
export type VersionedOutcome = 'updated' | 'missing' | 'stale';

/**
 * Tells "no row changed" apart: the record is gone, or it exists with a newer version. `table` is always a constant
 * from the calling repository, never request input.
 * 区分 "没有行被修改" 的两种情况：记录已不存在，或记录存在但版本更新。`table` 始终是调用方仓储中的常量，绝不是请求输入。
 */
export async function versionedOutcome(db: D1Database, table: string, id: string, changes: number): Promise<VersionedOutcome> {
  if (changes > 0) return 'updated';
  const row = await db.prepare(`SELECT 1 AS present FROM ${table} WHERE id = ?`).bind(id).first();
  return row ? 'stale' : 'missing';
}

/** Whether an error from D1 is a UNIQUE constraint failure. */
/** D1 返回的错误是否为 UNIQUE 约束冲突。 */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}

/** Whether an error from D1 is a FOREIGN KEY constraint failure, such as a media key that no longer exists. */
/** D1 返回的错误是否为 FOREIGN KEY 约束冲突，例如引用了已不存在的媒体键。 */
export function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof Error && /FOREIGN KEY constraint failed/i.test(error.message);
}
