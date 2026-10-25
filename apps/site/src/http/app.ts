import { Hono } from 'hono';
import { ADMIN_API_PREFIX, isAdminApiPath } from '@msc-web/content';
import { renderNotFound, renderServerError } from '../pages/errors/ErrorPages';
import type { AppEnv } from './context';
import { apiErrorResponse } from './errors';
import { securityHeaders } from './middleware/security-headers';
import { adminAppRoutes } from './routes/admin-app';
import { adminApi } from './routes/admin';
import { mediaRoutes } from './routes/media';
import { publicRoutes } from './routes/public';
import { seoRoutes } from './routes/seo';
import { staticRoutes } from './routes/static';

/**
 * The msc-web Worker: public pages in two languages, uploaded media, the admin app and its JSON API. Errors on the
 * admin API are JSON; everywhere else they are pages.
 * msc-web Worker：两种语言的公开页面、上传的媒体、后台应用及其 JSON 接口。后台接口的错误以 JSON 返回，其他地方以页面返回。
 */
export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use('*', securityHeaders);

  // One address per page: /events/ redirects to /events. The admin app keeps its own trailing-slash paths.
  // 每个页面只有一个地址：/events/ 跳转到 /events。后台应用保留自身带斜杠的路径。
  app.use('*', async (c, next) => {
    const url = new URL(c.req.url);
    if ((c.req.method === 'GET' || c.req.method === 'HEAD') && url.pathname.length > 1 && url.pathname.endsWith('/') && !url.pathname.startsWith('/admin')) {
      url.pathname = url.pathname.replace(/\/+$/, '') || '/';
      return c.redirect(url.toString(), 301);
    }
    await next();
  });

  app.route(ADMIN_API_PREFIX, adminApi);
  app.route('/admin', adminAppRoutes);
  app.route('/media', mediaRoutes);
  app.route('/static', staticRoutes);
  app.route('/', seoRoutes);
  app.route('/', publicRoutes);

  app.notFound((c) => {
    if (isAdminApiPath(c.req.path)) return c.json({ error: { code: 'not_found', message: '接口不存在' } }, 404);
    return renderNotFound(c);
  });

  app.onError((error, c) => {
    if (isAdminApiPath(c.req.path)) return apiErrorResponse(error, c);
    console.error('[page]', error);
    return renderServerError(c);
  });

  return app;
}

export const app = createApp();
