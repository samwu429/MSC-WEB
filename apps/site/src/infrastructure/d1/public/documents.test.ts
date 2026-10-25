import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl } from '@msc-web/content';
import { createTestEnv, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../media';
import { sqlite } from '../testing/sqlite-d1';
import { listVisibleDocuments } from './documents';

const AT = '2026-09-01T00:00:00.000Z';
const PDF_KEY = 'doc/2026/0123456789abcdef0123456789abcdef.pdf';

describe.skipIf(!sqlite)('listVisibleDocuments', () => {
  let test: TestEnv;

  beforeEach(async () => {
    test = createTestEnv();
    await insertMedia(
      test.d1.db,
      {
        key: PDF_KEY,
        url: mediaUrl(PDF_KEY),
        kind: 'document',
        contentType: 'application/pdf',
        size: 4,
        width: null,
        height: null,
        fileName: 'record.pdf',
        createdAt: AT,
      },
      'mem_president',
    );
    await test.media.bucket.put(PDF_KEY, new Uint8Array([37, 80, 68, 70]));
  });

  afterEach(() => test.close());

  it('returns visible records in the editor order, newest first within the same order', async () => {
    test.d1.exec(`
      INSERT INTO documents (id, category, title_zh, title_en, media_key, published_on, visible, sort_order, created_at, updated_at) VALUES
        ('old', 'meeting_records', '旧纪要', 'Old minutes', '${PDF_KEY}', '2026-01-10', 1, 1, '${AT}', '${AT}'),
        ('new', 'meeting_records', '新纪要', 'New minutes', '${PDF_KEY}', '2026-03-10', 1, 1, '${AT}', '${AT}'),
        ('pinned', 'constitution', '章程', 'Constitution', '${PDF_KEY}', '2025-01-01', 1, 0, '${AT}', '${AT}'),
        ('hidden', 'constitution', '隐藏', 'Hidden', '${PDF_KEY}', '2026-05-01', 0, 0, '${AT}', '${AT}');
    `);
    const documents = await listVisibleDocuments(test.d1.db);
    expect(documents.map((document) => document.id)).toEqual(['pinned', 'new', 'old']);
    expect(documents[0]).toMatchObject({ category: 'constitution', mediaKey: PDF_KEY, publishedOn: '2025-01-01', visible: true });
  });

  it('returns nothing when no record is published', async () => {
    expect(await listVisibleDocuments(test.d1.db)).toEqual([]);
  });
});
