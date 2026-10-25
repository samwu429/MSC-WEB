import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mediaUrl } from '@msc-web/content';
import { createTestEnv, type TestEnv } from '../testing/test-env';
import { insertMedia } from '../infrastructure/d1/media';
import { sqlite } from '../infrastructure/d1/testing/sqlite-d1';
import { cleanUpUnusedMedia } from './media-cleanup';

const NOW = new Date('2026-10-25T07:17:00Z');
const TWO_DAYS_AGO = Date.parse('2026-10-23T07:17:00Z');

function imageKey(index: number): string {
  return `img/2026/${index.toString(16).padStart(32, '0')}.jpg`;
}

describe.skipIf(!sqlite)('cleanUpUnusedMedia', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    test.close();
  });

  /** Stores an image with its media row, created at the given instant. */
  /** 存储一张图片及其媒体记录，创建时间为给定时刻。 */
  async function upload(key: string, createdAt: number): Promise<void> {
    await insertMedia(
      test.env.DB,
      { key, url: mediaUrl(key), kind: 'image', contentType: 'image/jpeg', size: 3, width: 1, height: 1, fileName: 'a.jpg', createdAt: new Date(createdAt).toISOString() },
      'mem_president',
    );
    await test.media.bucket.put(key, new Uint8Array([1, 2, 3]));
  }

  function hasRow(key: string): boolean {
    return test.d1.rows('SELECT key FROM media WHERE key = ?', key).length === 1;
  }

  function stored(key: string): boolean {
    return test.media.objects.has(key) && hasRow(key);
  }

  function removed(key: string): boolean {
    return !test.media.objects.has(key) && !hasRow(key);
  }

  /** Refers to every key from the settings document, as the hero image and QR code do. */
  /** 在设置文档中引用所有键，与首页图片和二维码的引用方式相同。 */
  function referFromSettings(keys: string[]): void {
    test.d1.raw.prepare('INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)').run('site', JSON.stringify({ keys }), '2026-01-01T00:00:00.000Z', 'mem_x');
  }

  it('removes old uploads nothing refers to and keeps those in use or still recent', async () => {
    const orphan = imageKey(1);
    const onPerson = imageKey(2);
    const inSettings = imageKey(3);
    const recent = imageKey(4);
    await upload(orphan, TWO_DAYS_AGO);
    await upload(onPerson, TWO_DAYS_AGO);
    await upload(inSettings, TWO_DAYS_AGO);
    await upload(recent, NOW.getTime() - 60 * 60 * 1000);
    test.d1.exec(`INSERT INTO people (id, section, position, photo_key, created_at, updated_at)
      VALUES ('per_1', 'presidium', 'president', '${onPerson}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`);
    referFromSettings([inSettings]);

    await cleanUpUnusedMedia(test.env, NOW);

    expect(removed(orphan)).toBe(true);
    expect(stored(onPerson)).toBe(true);
    expect(stored(inSettings)).toBe(true);
    expect(stored(recent)).toBe(true);
    expect(console.log).toHaveBeenCalledWith('[media-cleanup]', expect.stringContaining('removed 1 unused uploads'));
  });

  it('reaches an orphan behind more than a page of older files in use', async () => {
    const inUse = Array.from({ length: 150 }, (_, index) => imageKey(100 + index));
    for (const [index, key] of inUse.entries()) await upload(key, TWO_DAYS_AGO - 10_000_000 + index * 1000);
    const orphan = imageKey(999);
    await upload(orphan, TWO_DAYS_AGO);
    referFromSettings(inUse);

    await cleanUpUnusedMedia(test.env, NOW);

    expect(removed(orphan)).toBe(true);
    expect(inUse.every(stored)).toBe(true);
  });

  it('removes at most 500 uploads in one run, oldest first, with one query and one bucket call per page', async () => {
    const orphans = Array.from({ length: 520 }, (_, index) => imageKey(2000 + index));
    for (const [index, key] of orphans.entries()) await upload(key, TWO_DAYS_AGO - 1_000_000 + index * 1000);
    test.d1.statements.length = 0;
    const deletes = vi.spyOn(test.media.bucket, 'delete');

    await cleanUpUnusedMedia(test.env, NOW);

    expect(orphans.slice(0, 500).every(removed)).toBe(true);
    expect(orphans.slice(500).every(stored)).toBe(true);
    expect(test.d1.statements).toHaveLength(5);
    expect(deletes).toHaveBeenCalledTimes(5);
    expect(console.log).toHaveBeenCalledWith('[media-cleanup]', expect.stringContaining('removed 500 unused uploads'));
  });

  it('puts the rows back and stops when the bucket refuses, so the next run tries the same files', async () => {
    const orphans = Array.from({ length: 120 }, (_, index) => imageKey(3000 + index));
    for (const [index, key] of orphans.entries()) await upload(key, TWO_DAYS_AGO - 1_000_000 + index * 1000);
    const before = test.d1.rows('SELECT * FROM media ORDER BY key');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const refusedDelete = vi.fn(async () => Promise.reject(new Error('R2 unavailable')));
    const refusing = { ...test.env, MEDIA: Object.assign(Object.create(test.media.bucket) as R2Bucket, { delete: refusedDelete }) };

    await cleanUpUnusedMedia(refusing, NOW);

    expect(refusedDelete).toHaveBeenCalledTimes(1);
    expect(test.d1.rows('SELECT * FROM media ORDER BY key')).toEqual(before);
    expect(orphans.every(stored)).toBe(true);
    expect(console.log).toHaveBeenCalledWith('[media-cleanup]', expect.stringContaining('removed 0 unused uploads'));

    await cleanUpUnusedMedia(test.env, NOW);
    expect(orphans.every(removed)).toBe(true);
  });
});
