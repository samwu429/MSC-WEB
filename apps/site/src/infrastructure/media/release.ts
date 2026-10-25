import type { Env } from '../../env';
import { deleteUnreferencedMedia, restoreMedia } from '../d1/media';
import type { MediaRow } from '../d1/rows/media';
import { deleteMediaObjects } from '../r2/media-store';

/**
 * Removes files that a save or delete stopped using: a replaced photo, a deleted event's gallery. A key is removed
 * only if no record still refers to it, so shared or re-attached files are kept. Run it after the write has
 * committed, usually inside waitUntil. However many keys there are, it costs one D1 query and one bucket call, so a
 * large gallery stays inside the per-invocation query budget; failures leave the files for the daily cleanup.
 * 移除保存或删除后不再使用的文件：被替换的照片、已删除活动的相册。只有在没有任何记录仍引用某个键时才会移除它，
 * 因此共用或重新引用的文件会被保留。在写入提交之后运行，通常放在 waitUntil 中。无论有多少个键，都只需一次 D1 查询和一次存储桶调用，
 * 因此较大的相册也不会超出每次调用的查询次数上限；失败时文件会留给每日清理。
 */
export async function releaseMedia(env: Pick<Env, 'DB' | 'MEDIA'>, keys: readonly (string | null | undefined)[]): Promise<void> {
  const unique = [...new Set(keys.filter((key): key is string => Boolean(key)))];
  if (unique.length === 0) return;
  try {
    await removeStoredFiles(env, await deleteUnreferencedMedia(env.DB, unique));
  } catch (error) {
    console.error('[media-release]', unique, error);
  }
}

/**
 * Removes the stored files of media rows that were just deleted. If the bucket refuses, the rows are put back, so the
 * daily cleanup tries those files again. Returns whether the files were removed.
 * 移除刚被删除的媒体记录所对应的存储文件。若存储桶拒绝，记录会被放回，每日清理因此会再次尝试这些文件。返回文件是否已移除。
 */
export async function removeStoredFiles(env: Pick<Env, 'DB' | 'MEDIA'>, rows: readonly MediaRow[]): Promise<boolean> {
  if (rows.length === 0) return true;
  const keys = rows.map((row) => row.key);
  try {
    await deleteMediaObjects(env.MEDIA, keys);
    return true;
  } catch (error) {
    console.error('[media-release] restoring rows the bucket kept', keys, error);
    await restoreMedia(env.DB, rows);
    return false;
  }
}

/** Keys that were in `before` but are not in `after`. */
/** 在 `before` 中但不在 `after` 中的键。 */
export function droppedKeys(before: readonly (string | null)[], after: readonly (string | null)[]): string[] {
  const kept = new Set(after.filter(Boolean));
  return before.filter((key): key is string => Boolean(key) && !kept.has(key));
}
