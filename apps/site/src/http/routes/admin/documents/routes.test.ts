import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl, type ApiErrorBody, type DocumentResponse, type DocumentsResponse, type MediaKind, type SiteDocumentInput } from '@msc-web/content';
import { app } from '../../../app';
import { TEST_TOKENS, asOfficer, createTestEnv, removingMediaBeforeWrite, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const PDF_A = 'doc/2026/0123456789abcdef0123456789abcdef.pdf';
const PDF_B = 'doc/2026/fedcba9876543210fedcba9876543210.pdf';
const IMAGE = 'img/2026/0123456789abcdef0123456789abcdef.jpg';

function documentInput(overrides: Partial<SiteDocumentInput> = {}): SiteDocumentInput {
  return {
    category: 'constitution',
    title: { zh: 'UTMMSC 章程', en: 'UTMMSC Constitution' },
    mediaKey: PDF_A,
    publishedOn: '2026-09-01',
    visible: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe.skipIf(!sqlite)('document routes', () => {
  let test: TestEnv;

  beforeEach(async () => {
    test = createTestEnv();
    await upload(PDF_A, 'document');
    await upload(PDF_B, 'document');
    await upload(IMAGE, 'image');
  });

  afterEach(() => test.close());

  async function upload(key: string, kind: MediaKind): Promise<void> {
    await insertMedia(
      test.env.DB,
      {
        key,
        url: mediaUrl(key),
        kind,
        contentType: kind === 'image' ? 'image/jpeg' : 'application/pdf',
        size: 3,
        width: null,
        height: null,
        fileName: 'file',
        createdAt: '2026-10-01T00:00:00.000Z',
      },
      'mem_president',
    );
    await test.media.bucket.put(key, new Uint8Array([1, 2, 3]));
  }

  async function call(path: string, init: RequestInit, env = test.env) {
    const ctx = testExecutionContext();
    const response = await app.request(`/admin/api/documents${path}`, init, env, ctx);
    await ctx.settle();
    return response;
  }

  async function create(input: SiteDocumentInput, token: string = TEST_TOKENS.president) {
    const response = await call('', asOfficer(token, input));
    expect(response.status).toBe(201);
    return ((await response.json()) as DocumentResponse).document;
  }

  function isStored(key: string): boolean {
    return test.media.objects.has(key) && test.d1.rows('SELECT key FROM media WHERE key = ?', key).length === 1;
  }

  it('creates a document that the list and the detail then show', async () => {
    const document = await create(documentInput(), TEST_TOKENS.finance);
    expect(document).toMatchObject({ category: 'constitution', mediaKey: PDF_A, visible: true });
    expect(document.id).toMatch(/^doc_[0-9a-f]{32}$/);

    const list = (await (await call('', asOfficer(TEST_TOKENS.finance))).json()) as DocumentsResponse;
    expect(list.documents).toEqual([document]);
    const detail = await call(`/${document.id}`, asOfficer(TEST_TOKENS.finance));
    expect(((await detail.json()) as DocumentResponse).document).toEqual(document);
    expect(test.d1.rows('SELECT action, entity, member_id, summary FROM change_log')).toEqual([
      { action: 'create', entity: 'document', member_id: 'mem_finance', summary: 'UTMMSC 章程' },
    ]);
  });

  it('lists documents in category order, newest first within a category', async () => {
    const minutes = await create(documentInput({ category: 'meeting_records', publishedOn: '2026-10-01' }));
    const oldAccounts = await create(documentInput({ category: 'public_accounts', publishedOn: '2025-09-01' }));
    const newAccounts = await create(documentInput({ category: 'public_accounts', publishedOn: '2026-09-01', visible: false }));
    const constitution = await create(documentInput());
    const list = (await (await call('', asOfficer(TEST_TOKENS.president))).json()) as DocumentsResponse;
    expect(list.documents.map((document) => document.id)).toEqual([constitution.id, newAccounts.id, oldAccounts.id, minutes.id]);
  });

  it('reports every invalid field at once and accepts only a PDF upload as the file', async () => {
    const response = await call('', asOfficer(TEST_TOKENS.president, { ...documentInput({ mediaKey: IMAGE, publishedOn: '2026-02-30' }), category: 'minutes' }));
    expect(response.status).toBe(400);
    const body = (await response.json()) as ApiErrorBody;
    expect(body.error.issues?.map((issue) => issue.field).sort()).toEqual(['category', 'mediaKey', 'publishedOn']);
  });

  it('reports a PDF that was never uploaded on the file field', async () => {
    const response = await call('', asOfficer(TEST_TOKENS.president, documentInput({ mediaKey: 'doc/2026/11111111111111111111111111111111.pdf' })));
    expect(response.status).toBe(400);
    expect(((await response.json()) as ApiErrorBody).error.issues).toEqual([{ field: 'mediaKey', message: '文件不存在，请重新上传' }]);
    expect(test.d1.rows('SELECT id FROM documents')).toEqual([]);
  });

  it('reports a PDF removed between the check and the write on the file field', async () => {
    const response = await call('', asOfficer(TEST_TOKENS.president, documentInput()), removingMediaBeforeWrite(test, PDF_A));
    expect(response.status).toBe(400);
    expect(((await response.json()) as ApiErrorBody).error.issues).toEqual([{ field: 'mediaKey', message: '文件不存在，请重新上传' }]);
    expect(test.d1.rows('SELECT id FROM documents')).toEqual([]);
  });

  it('saves a new file over the loaded version and releases the old file', async () => {
    const document = await create(documentInput());
    const response = await call(
      `/${document.id}`,
      asOfficer(TEST_TOKENS.president, { value: documentInput({ mediaKey: PDF_B, title: { zh: '章程（修订）', en: '' } }), expectedUpdatedAt: document.updatedAt }, 'PUT'),
    );
    expect(response.status).toBe(200);
    const saved = ((await response.json()) as DocumentResponse).document;
    expect(saved).toMatchObject({ id: document.id, mediaKey: PDF_B, title: { zh: '章程（修订）', en: '' } });
    expect(isStored(PDF_A)).toBe(false);
    expect(isStored(PDF_B)).toBe(true);
  });

  it('keeps a file another document still uses', async () => {
    const first = await create(documentInput());
    await create(documentInput({ category: 'other' }));
    await call(`/${first.id}`, asOfficer(TEST_TOKENS.president, { value: documentInput({ mediaKey: PDF_B }), expectedUpdatedAt: first.updatedAt }, 'PUT'));
    expect(isStored(PDF_A)).toBe(true);
  });

  it('refuses a save over an older version and keeps the file', async () => {
    const document = await create(documentInput());
    const body = { value: documentInput({ mediaKey: PDF_B }), expectedUpdatedAt: document.updatedAt };
    expect((await call(`/${document.id}`, asOfficer(TEST_TOKENS.president, body, 'PUT'))).status).toBe(200);
    const stale = await call(`/${document.id}`, asOfficer(TEST_TOKENS.president, { ...body, value: documentInput() }, 'PUT'));
    expect(stale.status).toBe(409);
    expect(((await stale.json()) as ApiErrorBody).error.code).toBe('stale');
    expect(isStored(PDF_B)).toBe(true);
  });

  it('requires a version on every save', async () => {
    const document = await create(documentInput());
    const response = await call(`/${document.id}`, asOfficer(TEST_TOKENS.president, { value: documentInput() }, 'PUT'));
    expect(response.status).toBe(400);
  });

  it('deletes a document, releases its file and answers 404 afterwards', async () => {
    const document = await create(documentInput());
    const response = await call(`/${document.id}`, asOfficer(TEST_TOKENS.president, undefined, 'DELETE'));
    expect(response.status).toBe(204);
    expect(isStored(PDF_A)).toBe(false);
    expect(test.d1.rows('SELECT action FROM change_log ORDER BY rowid')).toEqual([{ action: 'create' }, { action: 'delete' }]);

    expect((await call(`/${document.id}`, asOfficer(TEST_TOKENS.president))).status).toBe(404);
    expect((await call(`/${document.id}`, asOfficer(TEST_TOKENS.president, undefined, 'DELETE'))).status).toBe(404);
    const update = await call(`/${document.id}`, asOfficer(TEST_TOKENS.president, { value: documentInput(), expectedUpdatedAt: document.updatedAt }, 'PUT'));
    expect(update.status).toBe(404);
  });

  it('keeps officers without the documents permission out', async () => {
    expect((await call('', asOfficer(TEST_TOKENS.academic, documentInput()))).status).toBe(403);
    expect(test.d1.rows('SELECT id FROM documents')).toEqual([]);
  });
});
