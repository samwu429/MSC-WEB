import { Hono } from 'hono';
import { SITE_CSS, STYLESHEET_PATH } from '../../../pages/styles/stylesheet';
import type { AppEnv } from '../../context';

/** Files with stable names (logo, default photos): cached for a day so a replaced file reaches everyone soon. */
/** 名称固定的文件（标志、默认照片）：缓存一天，替换后的文件很快就能到达所有人。 */
export const STATIC_DAY = 'public, max-age=86400';

export const IMMUTABLE = 'public, max-age=31536000, immutable';

/**
 * /static: the stylesheet (built from code, with its hash in the name) and the files in apps/site/static.
 * /static：样式表（由代码生成，名称中带哈希）以及 apps/site/static 中的文件。
 */
export const staticRoutes = new Hono<AppEnv>();

staticRoutes.get('/*', async (c) => {
  const path = new URL(c.req.url).pathname;
  if (path === STYLESHEET_PATH) {
    return c.body(SITE_CSS, 200, { 'content-type': 'text/css; charset=utf-8', 'cache-control': IMMUTABLE });
  }
  if (/^\/static\/site-[0-9a-f]{8}\.css$/.test(path)) {
    // An older stylesheet name from before a deploy: answer with the current one, briefly cached.
    // 部署之前的旧样式表名称：返回当前样式表，并只做短暂缓存。
    return c.body(SITE_CSS, 200, { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'public, max-age=300' });
  }
  const asset = await c.env.ASSETS.fetch(new Request(c.req.url, { method: c.req.method, headers: c.req.raw.headers }));
  if (asset.status !== 200 && asset.status !== 304) return c.notFound();
  const headers = new Headers(asset.headers);
  headers.set('cache-control', STATIC_DAY);
  return new Response(asset.body, { status: asset.status, headers });
});
