import type { MiddlewareHandler } from 'hono';
import type { AdminIdentity, SitePermission } from '@msc-web/content';
import { DEVELOPER_IDENTITY, developerSignInEnabled, identityForMember, timingSafeEqualText } from '../../domain/access/identity';
import type { Env } from '../../env';
import { lookupSessionMember } from '../../infrastructure/member-api/client';
import { cachedLookup } from '../../infrastructure/member-api/session-cache';
import type { AppEnv } from '../context';
import { forbidden, unauthorized, unavailable } from '../errors';

export function bearerToken(header: string | undefined): string {
  if (!header || !header.startsWith('Bearer ')) return '';
  return header.slice(7).trim();
}

/**
 * The identity behind a bearer token: the local developer when the developer token matches on localhost, else the
 * member network account, which must hold an office with at least one site permission.
 * Bearer 令牌背后的身份：在 localhost 上且开发令牌匹配时为本地开发者，否则为成员网络账号，该账号必须担任至少拥有一项网站权限的职位。
 */
export async function resolveIdentity(env: Env, token: string, url: URL): Promise<AdminIdentity> {
  if (developerSignInEnabled(env.DEV_ADMIN_TOKEN, url) && timingSafeEqualText(token, env.DEV_ADMIN_TOKEN)) return DEVELOPER_IDENTITY;
  const lookup = await cachedLookup(token, () => lookupSessionMember(env, token));
  if (lookup.kind === 'unavailable') throw unavailable('member_api_unavailable', '成员网络暂时无法验证登录，请稍后再试');
  if (lookup.kind === 'signed_out') throw unauthorized('登录已过期，请重新登录');
  const identity = identityForMember(lookup.member);
  if (!identity) throw forbidden('只有主席团、部长等干部可以进入官网后台');
  return identity;
}

/** Requires a signed-in officer and stores their identity for the route. */
/** 要求已登录的干部，并为路由保存其身份。 */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = bearerToken(c.req.header('authorization'));
  if (!token) throw unauthorized();
  c.set('identity', await resolveIdentity(c.env, token, new URL(c.req.url)));
  await next();
};

/** Requires one site permission; place after requireAdmin. */
/** 要求一项网站权限；须放在 requireAdmin 之后。 */
export function requirePermission(permission: SitePermission): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!c.get('identity').permissions.includes(permission)) throw forbidden();
    await next();
  };
}

/** Requires at least one of several permissions, for shared tools such as uploads. */
/** 要求多项权限中的至少一项，用于上传等共用功能。 */
export function requireAnyPermission(permissions: readonly SitePermission[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const held = c.get('identity').permissions;
    if (!permissions.some((permission) => held.includes(permission))) throw forbidden();
    await next();
  };
}
