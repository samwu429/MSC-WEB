import type { Env } from '../env';
import { deleteUnreferencedMediaCreatedBefore } from '../infrastructure/d1/media';
import { removeStoredFiles } from '../infrastructure/media/release';

/** Younger uploads may still sit on an open form that has not been saved yet. */
/** 较新的上传可能仍在尚未保存的表单中。 */
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

const PAGE_SIZE = 100;

/**
 * A page costs one D1 query and one bucket call, so a run stays far inside the free plan's 50 queries per
 * invocation; a larger backlog waits for the next day.
 * 每页只需一次 D1 查询和一次存储桶调用，因此单次运行远低于免费计划每次调用 50 次查询的上限；更多的积压留待次日处理。
 */
const MAX_PAGES_PER_RUN = 5;

/**
 * Daily cleanup of uploads that no record uses: files never attached, and released files the bucket failed to remove.
 * Each page deletes the unused rows in one guarded statement, then their files in one bucket call. If the bucket
 * refuses, the rows are put back and the run stops, so the same files are tried again the next day.
 * 每日清理没有任何记录使用的上传：从未被引用的文件，以及释放时存储桶未能移除的文件。每页先用一条带引用检查的语句删除未使用的记录，
 * 再用一次存储桶调用删除其文件。若存储桶拒绝，记录会被放回并结束本次运行，次日会再次尝试这些文件。
 */
export async function cleanUpUnusedMedia(env: Env, now: Date = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - GRACE_PERIOD_MS).toISOString();
  let removed = 0;
  for (let page = 0; page < MAX_PAGES_PER_RUN; page += 1) {
    const rows = await deleteUnreferencedMediaCreatedBefore(env.DB, cutoff, PAGE_SIZE);
    if (!(await removeStoredFiles(env, rows))) break;
    removed += rows.length;
    if (rows.length < PAGE_SIZE) break;
  }
  console.log('[media-cleanup]', `removed ${removed} unused uploads created before ${cutoff}`);
}
