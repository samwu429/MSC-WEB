import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../context';

/**
 * Public pages run no script at all, so their policy allows none; the admin app loads only its own bundle. Neither
 * may be framed. Uploaded media is served with nosniff and a type from a fixed list, so it cannot run as a page.
 * 公开页面完全不运行脚本，因此其策略不允许任何脚本；后台应用只加载自己的打包文件。两者都不允许被嵌入框架。
 * 上传的媒体以 nosniff 和固定列表中的类型提供，因此不可能作为页面运行。
 */
export const PUBLIC_PAGE_CSP = [
  "default-src 'self'",
  "script-src 'none'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

export const ADMIN_APP_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

export const securityHeaders: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();
  const headers = c.res.headers;
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  if (!headers.has('x-frame-options')) headers.set('x-frame-options', 'DENY');
  if (new URL(c.req.url).protocol === 'https:') headers.set('strict-transport-security', 'max-age=31536000');
  const type = headers.get('content-type') ?? '';
  if (type.startsWith('text/html') && !headers.has('content-security-policy')) {
    headers.set('content-security-policy', c.req.path.startsWith('/admin') ? ADMIN_APP_CSP : PUBLIC_PAGE_CSP);
  }
};
