import { defineConfig } from 'vitest/config';

/** Unit tests for the admin app's logic; screens are checked by type-checking and in the browser. */
/** 后台应用逻辑的单元测试；界面通过类型检查与浏览器进行检验。 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
