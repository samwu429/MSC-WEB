import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Assembles ./public, the Worker's static-assets directory: the site's own files from ./static at /static/, and
 * the admin build from ../admin/dist at /admin/. The admin build is optional here so `wrangler dev` works on the
 * public pages before the admin app has been built.
 * 组装 Worker 的静态资源目录 ./public：./static 中的网站文件放在 /static/，../admin/dist 中的后台构建放在 /admin/。
 * 这里后台构建是可选的，因此在后台应用构建之前，`wrangler dev` 也可以用于公开页面。
 */
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(siteRoot, 'public');
const staticDir = path.join(siteRoot, 'static');
const adminDist = path.resolve(siteRoot, '../admin/dist');

fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.cpSync(staticDir, path.join(publicDir, 'static'), { recursive: true });

if (fs.existsSync(path.join(adminDist, 'index.html'))) {
  fs.cpSync(adminDist, path.join(publicDir, 'admin'), { recursive: true });
  console.log('Staged static files and the admin app.');
} else {
  console.warn('apps/admin/dist is missing; staged static files only. Run `npm run build` at the repository root for the admin app.');
}
