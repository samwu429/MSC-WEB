import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl, type AdminIdentity, type SiteDocumentInput } from '@msc-web/content';
import { createDocument, deleteDocument, findDocument, listDocuments, updateDocument } from './documents';
import { insertMedia } from './media';
import { createSqliteD1, sqlite, type SqliteD1 } from './testing/sqlite-d1';

const EDITOR: AdminIdentity = {
  memberId: 'mem_finance',
  displayName: '测试财务副主席',
  role: 'vp_finance',
  roleLabel: { zh: '财务副主席', en: 'Vice-President, Finance' },
  permissions: ['documents.edit'],
  source: 'member',
};

const PDF_A = 'doc/2026/0123456789abcdef0123456789abcdef.pdf';
const PDF_B = 'doc/2026/fedcba9876543210fedcba9876543210.pdf';

function documentInput(overrides: Partial<SiteDocumentInput> = {}): SiteDocumentInput {
  return {
    category: 'public_accounts',
    title: { zh: '2025-2026 年度公开账目', en: 'Public Accounts 2025-2026' },
    mediaKey: PDF_A,
    publishedOn: '2026-09-01',
    visible: true,
    sortOrder: 0,
    ...overrides,
  };
}

interface ChangeRow {
  action: string;
  entity: string;
  entity_id: string;
  summary: string;
}

describe.skipIf(!sqlite)('documents repository', () => {
  let d1: SqliteD1;

  beforeEach(async () => {
    d1 = createSqliteD1();
    for (const key of [PDF_A, PDF_B]) {
      await insertMedia(
        d1.db,
        { key, url: mediaUrl(key), kind: 'document', contentType: 'application/pdf', size: 100, width: null, height: null, fileName: 'a.pdf', createdAt: '2026-09-01T00:00:00.000Z' },
        'mem_finance',
      );
    }
  });

  afterEach(() => d1.close());

  function changes(): ChangeRow[] {
    return d1.rows<ChangeRow>('SELECT action, entity, entity_id, summary FROM change_log ORDER BY rowid');
  }

  it('creates a document, reads it back and logs the change under the Chinese title', async () => {
    const created = await createDocument(d1.db, EDITOR, documentInput());
    expect(created.id).toMatch(/^doc_[0-9a-f]{32}$/);
    expect(await findDocument(d1.db, created.id)).toEqual(created);
    expect(changes()).toEqual([{ action: 'create', entity: 'document', entity_id: created.id, summary: '2025-2026 年度公开账目' }]);
  });

  it('logs the English title when there is no Chinese one', async () => {
    await createDocument(d1.db, EDITOR, documentInput({ title: { zh: '', en: 'Election Results 2026' } }));
    expect(changes()[0]?.summary).toBe('Election Results 2026');
  });

  it('lists every document by category order, then in the About page order: sort order, newest first, latest created first', async () => {
    const olderAccounts = await createDocument(d1.db, EDITOR, documentInput({ publishedOn: '2025-09-01' }));
    const pinnedLast = await createDocument(d1.db, EDITOR, documentInput({ publishedOn: '2027-01-01', sortOrder: 5 }));
    const minutesSecond = await createDocument(d1.db, EDITOR, documentInput({ category: 'meeting_records', publishedOn: '2026-10-01', sortOrder: 2 }));
    const minutesFirst = await createDocument(d1.db, EDITOR, documentInput({ category: 'meeting_records', publishedOn: '2026-10-01', sortOrder: 1 }));
    const newerAccounts = await createDocument(d1.db, EDITOR, documentInput({ publishedOn: '2026-09-01', visible: false }));
    const constitution = await createDocument(d1.db, EDITOR, documentInput({ category: 'constitution', publishedOn: '2024-01-01' }));
    const other = await createDocument(d1.db, EDITOR, documentInput({ category: 'other', publishedOn: '2027-01-01' }));
    d1.exec(`UPDATE documents SET created_at = '2026-01-01T00:00:00.000Z' WHERE id = '${minutesFirst.id}'`);
    d1.exec(`UPDATE documents SET created_at = '2026-01-02T00:00:00.000Z', sort_order = 1 WHERE id = '${minutesSecond.id}'`);

    const ids = (await listDocuments(d1.db)).map((document) => document.id);
    expect(ids).toEqual([constitution.id, newerAccounts.id, olderAccounts.id, pinnedLast.id, minutesSecond.id, minutesFirst.id, other.id]);
  });

  it('saves over the loaded version with a later one and refuses an older one', async () => {
    const created = await createDocument(d1.db, EDITOR, documentInput());
    const saved = await updateDocument(d1.db, EDITOR, created.id, documentInput({ mediaKey: PDF_B, visible: false }), created.updatedAt);
    if (saved.outcome !== 'updated') throw new Error(`expected an update, got ${saved.outcome}`);
    expect(saved.document).toMatchObject({ id: created.id, mediaKey: PDF_B, visible: false, createdAt: created.createdAt });
    expect(saved.document.updatedAt > created.updatedAt).toBe(true);
    expect(await findDocument(d1.db, created.id)).toEqual(saved.document);

    const again = await updateDocument(d1.db, EDITOR, created.id, documentInput({ title: { zh: '覆盖', en: '' } }), created.updatedAt);
    expect(again).toEqual({ outcome: 'stale' });
    expect((await findDocument(d1.db, created.id))?.mediaKey).toBe(PDF_B);
  });

  it('tells a missing document apart from a stale one', async () => {
    expect(await updateDocument(d1.db, EDITOR, 'doc_missing', documentInput(), '2026-01-01T00:00:00.000Z')).toEqual({ outcome: 'missing' });
  });

  it('deletes a document, returns it as it was and logs the deletion', async () => {
    const created = await createDocument(d1.db, EDITOR, documentInput());
    expect(await deleteDocument(d1.db, EDITOR, created.id)).toEqual(created);
    expect(await findDocument(d1.db, created.id)).toBeNull();
    expect(changes().map((change) => change.action)).toEqual(['create', 'delete']);
    expect(await deleteDocument(d1.db, EDITOR, created.id)).toBeNull();
  });
});
