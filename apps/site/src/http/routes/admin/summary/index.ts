import { Hono } from 'hono';
import type { SummaryResponse } from '@msc-web/content';
import { listRecentChanges } from '../../../../infrastructure/d1/change-log';
import { countContent } from '../../../../infrastructure/d1/summary';
import type { AppEnv } from '../../../context';

/** How many of the latest changes the dashboard lists. */
/** 概览页列出的最近修改条数。 */
const RECENT_CHANGES = 20;

/**
 * /admin/api/summary: the dashboard every officer sees after signing in, whatever their permissions.
 * /admin/api/summary：每位干部登录后都会看到的概览页，与其权限无关。
 */
export const summaryRoutes = new Hono<AppEnv>();

summaryRoutes.get('/', async (c) => {
  const [counts, recentChanges] = await Promise.all([countContent(c.env.DB, new Date()), listRecentChanges(c.env.DB, RECENT_CHANGES)]);
  const response: SummaryResponse = { counts, recentChanges };
  return c.json(response);
});
