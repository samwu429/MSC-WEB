import type { Context } from 'hono';
import type { AppEnv } from '../http/context';
import type { PageContext } from './context';
import { Document, type PageMeta } from './layout/Document';

/** Public pages change only when an officer saves; a minute of browser caching keeps them fast and fresh enough. */
/** 公开页面只在干部保存时才会变化；浏览器缓存一分钟，既快又足够新。 */
export const PAGE_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

/**
 * Renders a page inside the site shell. `body` is the page's own content between header and footer.
 * 在网站外壳中渲染一个页面。`body` 是页眉与页脚之间的页面内容。
 */
export async function renderPage(c: Context<AppEnv>, ctx: PageContext, meta: PageMeta, body: unknown, status: 200 | 404 | 500 = 200): Promise<Response> {
  const html = await (
    <Document ctx={ctx} meta={meta}>
      {body}
    </Document>
  ).toString();
  return c.html(`<!doctype html>${html}`, status, {
    'cache-control': status === 200 ? PAGE_CACHE_CONTROL : 'no-store',
  });
}
