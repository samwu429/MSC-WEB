import { Hono } from 'hono';
import type { AppEnv } from '../../context';
import { sitemapXml } from './sitemap';

/** robots.txt and sitemap.xml. The admin app and its API are kept out of search engines. */
/** robots.txt 与 sitemap.xml。后台应用及其接口不进入搜索引擎。 */
export const seoRoutes = new Hono<AppEnv>();

seoRoutes.get('/robots.txt', (c) => {
  const origin = c.env.PUBLIC_ORIGIN.replace(/\/+$/, '');
  const body = ['User-agent: *', 'Disallow: /admin/', 'Disallow: /UTMMSC/', 'Disallow: /api/', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
  return c.text(body, 200, { 'cache-control': 'public, max-age=86400' });
});

seoRoutes.get('/sitemap.xml', async (c) => {
  return c.body(await sitemapXml(c.env), 200, { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' });
});
