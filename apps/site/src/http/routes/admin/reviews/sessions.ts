import { Hono } from 'hono';
import { validateReviewSessionInput, type ReviewSessionResponse } from '@msc-web/content';
import { listMaterialsOfSession } from '../../../../infrastructure/d1/review-materials';
import { deleteSession, findSessionDetail, updateSession } from '../../../../infrastructure/d1/review-sessions';
import { releaseMedia } from '../../../../infrastructure/media/release';
import type { AppEnv } from '../../../context';
import { notFound, stale } from '../../../errors';
import { readVersionedBody, validOrThrow } from '../../../request/body';
import { materialRoutes } from './materials';

/**
 * Review sessions at /admin/api/review-sessions, addressed by id once created under their course, together with
 * the materials of each session.
 * 位于 /admin/api/review-sessions 的复习场次接口：场次在所属课程下创建后按 id 访问，每场复习的资料也在此编辑。
 */
export const sessionReviewRoutes = new Hono<AppEnv>();

sessionReviewRoutes.get('/:id', async (c) => {
  const session = await findSessionDetail(c.env.DB, c.req.param('id'));
  if (!session) throw notFound();
  const body: ReviewSessionResponse = { session };
  return c.json(body);
});

sessionReviewRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const { value, expectedUpdatedAt } = await readVersionedBody(c);
  const input = validOrThrow(validateReviewSessionInput(value));
  const update = await updateSession(c.env.DB, c.get('identity'), id, input, expectedUpdatedAt);
  if (update.outcome !== 'updated') throw update.outcome === 'missing' ? notFound() : stale();
  const body: ReviewSessionResponse = { session: { ...update.session, materials: await listMaterialsOfSession(c.env.DB, id) } };
  return c.json(body);
});

sessionReviewRoutes.delete('/:id', async (c) => {
  const files = await deleteSession(c.env.DB, c.get('identity'), c.req.param('id'));
  if (!files) throw notFound();
  c.executionCtx.waitUntil(releaseMedia(c.env, files));
  return c.body(null, 204);
});

sessionReviewRoutes.route('/', materialRoutes);
