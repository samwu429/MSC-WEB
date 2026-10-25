/**
 * Bindings and variables of the msc-web Worker. Secrets are set with `wrangler secret put` or, for local
 * development, in apps/site/.dev.vars, and are never written in wrangler.jsonc.
 * msc-web Worker 的绑定与变量。密钥通过 `wrangler secret put` 设置，本地开发时写在 apps/site/.dev.vars，绝不写入 wrangler.jsonc。
 */
export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  /** The member network API Worker (utmmsc-api). */
  /** 成员网络的接口 Worker（utmmsc-api）。 */
  MEMBER_API?: Fetcher;
  MEMBER_API_ORIGIN: string;
  PUBLIC_ORIGIN: string;
  MEMBER_APP_URL: string;
  ANDROID_DOWNLOAD_URL: string;
  /**
   * Local development only: a bearer token that signs in as a developer with every permission, accepted only when
   * the request is addressed to localhost. Never set in production.
   * 仅限本地开发：一个以开发者身份登录并拥有全部权限的 Bearer 令牌，只在请求地址为 localhost 时接受。生产环境绝不设置。
   */
  DEV_ADMIN_TOKEN?: string;
}
