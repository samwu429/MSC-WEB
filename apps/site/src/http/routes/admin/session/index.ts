import { Hono } from 'hono';
import { asRecord, type LoginResponse, type SessionOptionsResponse, type SessionResponse } from '@msc-web/content';
import { developerSignInEnabled, identityForMember } from '../../../../domain/access/identity';
import { loginMember, logoutMember } from '../../../../infrastructure/member-api/client';
import { forgetToken } from '../../../../infrastructure/member-api/session-cache';
import type { AppEnv } from '../../../context';
import { HttpError, badRequest, forbidden, unavailable } from '../../../errors';
import { bearerToken, resolveIdentity } from '../../../middleware/admin-session';
import { readJsonBody } from '../../../request/body';

/**
 * Sign-in for the editing backend. Officers use their member network account; the website never sees or stores a
 * password beyond passing it to the member network once. A sign-in by a member without an office is refused and
 * the session the member network just created is ended again.
 * 编辑后台的登录。干部使用成员网络账号；官网除了把密码转交成员网络一次之外，从不查看或保存密码。
 * 没有职位的成员登录会被拒绝，成员网络刚刚创建的会话也会随即结束。
 */
export const sessionRoutes = new Hono<AppEnv>();

sessionRoutes.get('/options', (c) => {
  const body: SessionOptionsResponse = {
    developerSignIn: developerSignInEnabled(c.env.DEV_ADMIN_TOKEN, new URL(c.req.url)),
    memberAppUrl: c.env.MEMBER_APP_URL,
  };
  return c.json(body);
});

sessionRoutes.post('/login', async (c) => {
  const body = asRecord(await readJsonBody(c));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) throw badRequest('missing_credentials', '请输入邮箱和密码');
  if (email.length > 254 || password.length > 128) throw badRequest('invalid_credentials', '邮箱或密码格式不正确');

  const outcome = await loginMember(c.env, email, password, c.req.header('cf-connecting-ip') ?? null);
  if (outcome.kind === 'unavailable') throw unavailable('member_api_unavailable', '成员网络暂时无法登录，请稍后再试');
  if (outcome.kind === 'refused') throw new HttpError(outcome.status, 'login_refused', outcome.message);

  const identity = identityForMember(outcome.member);
  if (!identity) {
    c.executionCtx.waitUntil(logoutMember(c.env, outcome.token));
    throw forbidden('只有主席团、部长等干部可以进入官网后台');
  }
  const response: LoginResponse = { token: outcome.token, expiresAt: outcome.expiresAt, identity };
  return c.json(response);
});

sessionRoutes.get('/', async (c) => {
  const token = bearerToken(c.req.header('authorization'));
  if (!token) throw new HttpError(401, 'unauthorized', '请先登录');
  const response: SessionResponse = { identity: await resolveIdentity(c.env, token, new URL(c.req.url)) };
  return c.json(response);
});

/**
 * Ends a session the backend created itself. The admin app never calls this for a session borrowed from the member
 * app, so signing out of the backend does not sign anyone out of the member network.
 * 结束由后台自己创建的会话。对于从成员网络借用的会话，后台应用从不调用此接口，因此退出后台不会让任何人退出成员网络。
 */
sessionRoutes.post('/logout', async (c) => {
  const token = bearerToken(c.req.header('authorization'));
  if (token) {
    await forgetToken(token);
    if (!developerSignInEnabled(c.env.DEV_ADMIN_TOKEN, new URL(c.req.url)) || token !== c.env.DEV_ADMIN_TOKEN) {
      c.executionCtx.waitUntil(logoutMember(c.env, token));
    }
  }
  return c.body(null, 204);
});
