import { Hono } from 'hono';
import { validateReviewMaterialInput, type ReviewMaterialInput, type ReviewMaterialResponse } from '@msc-web/content';
import {
  MAX_MATERIALS_PER_SESSION,
  countMaterials,
  createMaterial,
  deleteMaterial,
  updateMaterial,
  type MaterialSession,
} from '../../../../infrastructure/d1/review-materials';
import { findSessionReference, sessionSummary } from '../../../../infrastructure/d1/review-sessions';
import { droppedKeys, releaseMedia } from '../../../../infrastructure/media/release';
import type { AppEnv } from '../../../context';
import { badRequest, notFound } from '../../../errors';
import { readJsonBody, validOrThrow } from '../../../request/body';
import { guardWrite } from '../../../request/guard-write';
import { requireMediaKeys } from '../../../request/media';

/**
 * Materials of one review session at /admin/api/review-sessions/:id/materials, mounted by the session router. A
 * material is an uploaded PDF or a link; a file that a save replaces or a delete drops is released after the write.
 * 单场复习的资料接口，位于 /admin/api/review-sessions/:id/materials，由场次路由挂载。资料为上传的 PDF 或一个链接；
 * 保存时被替换或删除时不再使用的文件会在写入之后释放。
 */
export const materialRoutes = new Hono<AppEnv>();

async function requireSession(db: D1Database, id: string): Promise<MaterialSession> {
  const session = await findSessionReference(db, id);
  if (!session) throw notFound();
  return { id: session.id, summary: sessionSummary(session) };
}

const FILE_FIELD = 'mediaKey';

async function validMaterialInput(db: D1Database, raw: unknown): Promise<ReviewMaterialInput> {
  const input = validOrThrow(validateReviewMaterialInput(raw));
  await requireMediaKeys(db, [{ field: FILE_FIELD, key: input.mediaKey, kind: 'document' }]);
  return input;
}

materialRoutes.post('/:id/materials', async (c) => {
  const session = await requireSession(c.env.DB, c.req.param('id'));
  if ((await countMaterials(c.env.DB, session.id)) >= MAX_MATERIALS_PER_SESSION) {
    throw badRequest('too_many_materials', `每场复习最多可添加 ${MAX_MATERIALS_PER_SESSION} 份资料`);
  }
  const input = await validMaterialInput(c.env.DB, await readJsonBody(c));
  const material = await guardWrite(() => createMaterial(c.env.DB, c.get('identity'), session, input), { mediaField: FILE_FIELD });
  const body: ReviewMaterialResponse = { material };
  return c.json(body, 201);
});

materialRoutes.put('/:id/materials/:materialId', async (c) => {
  const session = await requireSession(c.env.DB, c.req.param('id'));
  const input = await validMaterialInput(c.env.DB, await readJsonBody(c));
  const update = await guardWrite(() => updateMaterial(c.env.DB, c.get('identity'), session, c.req.param('materialId'), input), { mediaField: FILE_FIELD });
  if (!update) throw notFound();
  c.executionCtx.waitUntil(releaseMedia(c.env, droppedKeys([update.previousMediaKey], [update.material.mediaKey])));
  const body: ReviewMaterialResponse = { material: update.material };
  return c.json(body);
});

materialRoutes.delete('/:id/materials/:materialId', async (c) => {
  const session = await requireSession(c.env.DB, c.req.param('id'));
  const material = await deleteMaterial(c.env.DB, c.get('identity'), session, c.req.param('materialId'));
  if (!material) throw notFound();
  c.executionCtx.waitUntil(releaseMedia(c.env, [material.mediaKey]));
  return c.body(null, 204);
});
