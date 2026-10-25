import { Hono } from 'hono';
import { isAdminApiPath } from '@msc-web/content';
import type { AppEnv } from '../../context';
import { IMMUTABLE } from '../static';

const ADMIN_PREFIX = '/admin';

/**
 * The admin single-page app at /admin/. Built files under /admin/assets/ carry content hashes and are cached for a
 * year; every other path is a screen of the app and gets index.html, which is always revalidated so a deploy is
 * picked up on the next visit.
 * 位于 /admin/ 的后台单页应用。/admin/assets/ 下的构建文件带有内容哈希，缓存一年；其他路径都是应用中的页面，返回 index.html，
 * 并且每次都重新验证，部署后下一次访问即可生效。
 */
export const adminAppRoutes = new Hono<AppEnv>();

adminAppRoutes.get('/*', async (c) => {
  const url = new URL(c.req.url);
  // An admin API path that no API route matched must stay a JSON 404, never the app's index.html.
  // 未被任何接口路由匹配的后台接口路径必须保持为 JSON 404，绝不能返回应用的 index.html。
  if (isAdminApiPath(url.pathname)) {
    return c.json({ error: { code: 'not_found', message: '接口不存在' } }, 404);
  }
  if (url.pathname === ADMIN_PREFIX) return c.redirect(`${ADMIN_PREFIX}/${url.search}`, 301);
  const last = url.pathname.split('/').pop() ?? '';
  if (last.includes('.')) {
    const asset = await c.env.ASSETS.fetch(new Request(url, { method: c.req.method, headers: c.req.raw.headers }));
    if (asset.status !== 200 && asset.status !== 304) return c.text('Not Found', 404);
    const headers = new Headers(asset.headers);
    headers.set('cache-control', url.pathname.startsWith(`${ADMIN_PREFIX}/assets/`) ? IMMUTABLE : 'no-cache');
    return new Response(asset.body, { status: asset.status, headers });
  }
  const indexUrl = new URL(url);
  indexUrl.pathname = `${ADMIN_PREFIX}/index.html`;
  const index = await c.env.ASSETS.fetch(new Request(indexUrl, { method: 'GET' }));
  if (!index.ok) return c.text('后台尚未构建：请先运行 npm run build。', 503);
  const headers = new Headers(index.headers);
  headers.set('cache-control', 'no-cache');
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('x-robots-tag', 'noindex');
  return new Response(index.body, { status: 200, headers });
});
