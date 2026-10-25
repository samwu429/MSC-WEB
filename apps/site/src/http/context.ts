import type { AdminIdentity } from '@msc-web/content';
import type { Env } from '../env';

/** Hono environment shared by every route: Worker bindings, and the signed-in identity on admin routes. */
/** 所有路由共用的 Hono 环境：Worker 绑定，以及后台路由上的登录身份。 */
export interface AppEnv {
  Bindings: Env;
  Variables: {
    identity: AdminIdentity;
  };
}
