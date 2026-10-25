import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * The admin app is served by the site Worker at /admin/. In development, Vite serves it on port 5174 and forwards
 * the admin API, media and static files to `wrangler dev` on port 8787.
 * 后台应用由网站 Worker 在 /admin/ 提供。开发时由 Vite 在 5174 端口提供，并把后台接口、媒体与静态文件转发给 8787 端口上的 `wrangler dev`。
 */
const WORKER = 'http://127.0.0.1:8787';

export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/admin/api': WORKER,
      '/media': WORKER,
      '/static': WORKER,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
