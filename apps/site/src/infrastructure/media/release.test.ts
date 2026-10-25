import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mediaUrl } from '@msc-web/content';
import { createTestEnv, type TestEnv } from '../../testing/test-env';
import { insertMedia } from '../d1/media';
import { sqlite } from '../d1/testing/sqlite-d1';
import { droppedKeys, releaseMedia } from './release';

function imageKey(index: number): string {
  return `img/2026/${index.toString(16).padStart(32, '0')}.jpg`;
}

describe.skipIf(!sqlite)('releaseMedia', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    test.close();
  });

  async function upload(key: string): Promise<void> {
    await insertMedia(
      test.env.DB,
      { key, url: mediaUrl(key), kind: 'image', contentType: 'image/jpeg', size: 3, width: 1, height: 1, fileName: 'a.jpg', createdAt: '2026-10-01T00:00:00.000Z' },
      'mem_president',
    );
    await test.media.bucket.put(key, new Uint8Array([1, 2, 3]));
  }

  function stored(key: string): boolean {
    return test.media.objects.has(key) && test.d1.rows('SELECT key FROM media WHERE key = ?', key).length === 1;
  }

  function removed(key: string): boolean {
    return !test.media.objects.has(key) && test.d1.rows('SELECT key FROM media WHERE key = ?', key).length === 0;
  }

  it('removes the unused keys and keeps those a record or the settings still use', async () => {
    const unused = imageKey(1);
    const onPerson = imageKey(2);
    const inSettings = imageKey(3);
    for (const key of [unused, onPerson, inSettings]) await upload(key);
    test.d1.exec(`INSERT INTO people (id, section, position, photo_key, created_at, updated_at)
      VALUES ('per_1', 'presidium', 'president', '${onPerson}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`);
    test.d1.raw
      .prepare('INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)')
      .run('site', JSON.stringify({ hero: { imageKey: inSettings } }), '2026-01-01T00:00:00.000Z', 'mem_x');

    await releaseMedia(test.env, [unused, onPerson, inSettings, null, undefined, unused]);

    expect(removed(unused)).toBe(true);
    expect(stored(onPerson)).toBe(true);
    expect(stored(inSettings)).toBe(true);
  });

  it('releases a whole gallery with one D1 query and one bucket call', async () => {
    const keys = Array.from({ length: 150 }, (_, index) => imageKey(100 + index));
    for (const key of keys) await upload(key);
    test.d1.statements.length = 0;
    const deletes = vi.spyOn(test.media.bucket, 'delete');

    await releaseMedia(test.env, keys);

    expect(keys.every(removed)).toBe(true);
    expect(test.d1.statements).toHaveLength(1);
    expect(deletes).toHaveBeenCalledTimes(1);
  });

  it('runs no query when there is nothing to release', async () => {
    await releaseMedia(test.env, [null, undefined]);
    expect(test.d1.statements).toEqual([]);
  });

  it('puts the rows back when the bucket refuses, so the daily cleanup retries the files', async () => {
    const keys = [imageKey(1), imageKey(2)];
    for (const key of keys) await upload(key);
    const before = test.d1.rows('SELECT * FROM media ORDER BY key');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const MEDIA = Object.assign(Object.create(test.media.bucket) as R2Bucket, {
      delete: async () => Promise.reject(new Error('R2 unavailable')),
    });

    await releaseMedia({ ...test.env, MEDIA }, keys);

    expect(test.d1.rows('SELECT * FROM media ORDER BY key')).toEqual(before);
    expect(keys.every(stored)).toBe(true);
    expect(error).toHaveBeenCalled();
  });
});

describe('droppedKeys', () => {
  it('lists the keys that a save stopped using', () => {
    expect(droppedKeys(['a', 'b', null], ['b', 'c'])).toEqual(['a']);
    expect(droppedKeys([null], [null])).toEqual([]);
  });
});
