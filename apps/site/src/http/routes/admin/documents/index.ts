import { Hono } from 'hono';
import { validateDocumentInput, type DocumentResponse, type DocumentsResponse, type SiteDocumentInput } from '@msc-web/content';
import { createDocument, deleteDocument, findDocument, listDocuments, updateDocument } from '../../../../infrastructure/d1/documents';
import { droppedKeys, releaseMedia } from '../../../../infrastructure/media/release';
import type { AppEnv } from '../../../context';
import { notFound, stale } from '../../../errors';
import { readJsonBody, readVersionedBody, validOrThrow } from '../../../request/body';
import { guardWrite } from '../../../request/guard-write';
import { requireMediaKeys } from '../../../request/media';

/**
 * /admin/api/documents: the public records on the About page. Each one points at an uploaded PDF; replacing or
 * deleting a record releases the file it stopped using.
 * /admin/api/documents：关于页面上的公开记录。每条记录指向一份已上传的 PDF；替换或删除记录时会释放不再使用的文件。
 */
export const documentRoutes = new Hono<AppEnv>();

const FILE_FIELD = 'mediaKey';

async function requireDocumentFile(db: D1Database, input: SiteDocumentInput): Promise<void> {
  await requireMediaKeys(db, [{ field: FILE_FIELD, key: input.mediaKey, kind: 'document' }]);
}

documentRoutes.get('/', async (c) => {
  const response: DocumentsResponse = { documents: await listDocuments(c.env.DB) };
  return c.json(response);
});

documentRoutes.post('/', async (c) => {
  const input = validOrThrow(validateDocumentInput(await readJsonBody(c)));
  await requireDocumentFile(c.env.DB, input);
  const document = await guardWrite(() => createDocument(c.env.DB, c.get('identity'), input), { mediaField: FILE_FIELD });
  const response: DocumentResponse = { document };
  return c.json(response, 201);
});

documentRoutes.get('/:id', async (c) => {
  const document = await findDocument(c.env.DB, c.req.param('id'));
  if (!document) throw notFound();
  const response: DocumentResponse = { document };
  return c.json(response);
});

documentRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const { value, expectedUpdatedAt } = await readVersionedBody(c);
  const input = validOrThrow(validateDocumentInput(value));
  const previous = await findDocument(c.env.DB, id);
  if (!previous) throw notFound();
  if (previous.updatedAt !== expectedUpdatedAt) throw stale();
  await requireDocumentFile(c.env.DB, input);

  const result = await guardWrite(() => updateDocument(c.env.DB, c.get('identity'), id, input, expectedUpdatedAt), { mediaField: FILE_FIELD });
  if (result.outcome !== 'updated') throw result.outcome === 'missing' ? notFound() : stale();
  c.executionCtx.waitUntil(releaseMedia(c.env, droppedKeys([previous.mediaKey], [result.document.mediaKey])));
  const response: DocumentResponse = { document: result.document };
  return c.json(response);
});

documentRoutes.delete('/:id', async (c) => {
  const deleted = await deleteDocument(c.env.DB, c.get('identity'), c.req.param('id'));
  if (!deleted) throw notFound();
  c.executionCtx.waitUntil(releaseMedia(c.env, [deleted.mediaKey]));
  return c.body(null, 204);
});
