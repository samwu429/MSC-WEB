import { Hono } from 'hono';
import { SITE_PERMISSIONS } from '@msc-web/content';
import type { AppEnv } from '../../context';
import { requireAdmin, requireAnyPermission, requirePermission } from '../../middleware/admin-session';
import { documentRoutes } from './documents';
import { eventRoutes } from './events';
import { peopleRoutes } from './people';
import { courseRoutes } from './reviews/courses';
import { sessionReviewRoutes } from './reviews/sessions';
import { sessionRoutes } from './session';
import { settingsRoutes } from './settings';
import { summaryRoutes } from './summary';
import { uploadRoutes } from './uploads';

/**
 * The admin API at /admin/api. Sign-in routes are open; every other section requires a signed-in officer and the
 * permission that section edits. Section routers only define handlers; the guards live here so that no section
 * can be mounted without one.
 * 位于 /admin/api 的后台接口。登录相关路由公开；其余每个板块都要求已登录的干部，并要求该板块所编辑内容的权限。
 * 各板块路由只定义处理函数；权限检查统一放在这里，任何板块都不会在没有检查的情况下被挂载。
 */
export const adminApi = new Hono<AppEnv>();

adminApi.use('*', async (c, next) => {
  await next();
  c.res.headers.set('cache-control', 'no-store');
});

adminApi.route('/session', sessionRoutes);

const guards = [
  { path: '/summary', middleware: [requireAdmin] },
  { path: '/settings', middleware: [requireAdmin, requirePermission('settings.edit')] },
  { path: '/people', middleware: [requireAdmin, requirePermission('people.edit')] },
  { path: '/events', middleware: [requireAdmin, requirePermission('events.edit')] },
  { path: '/courses', middleware: [requireAdmin, requirePermission('reviews.edit')] },
  { path: '/review-sessions', middleware: [requireAdmin, requirePermission('reviews.edit')] },
  { path: '/documents', middleware: [requireAdmin, requirePermission('documents.edit')] },
  { path: '/uploads', middleware: [requireAdmin, requireAnyPermission(SITE_PERMISSIONS)] },
] as const;

// "/people/*" also matches "/people" itself, so one pattern guards a whole section.
// "/people/*" 同样匹配 "/people" 本身，因此一个模式即可保护整个板块。
for (const guard of guards) adminApi.use(`${guard.path}/*`, ...guard.middleware);

adminApi.route('/summary', summaryRoutes);
adminApi.route('/settings', settingsRoutes);
adminApi.route('/people', peopleRoutes);
adminApi.route('/events', eventRoutes);
adminApi.route('/courses', courseRoutes);
adminApi.route('/review-sessions', sessionReviewRoutes);
adminApi.route('/documents', documentRoutes);
adminApi.route('/uploads', uploadRoutes);
