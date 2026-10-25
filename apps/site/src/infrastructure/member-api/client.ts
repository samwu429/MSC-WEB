import type { Env } from '../../env';

/**
 * Calls to the UTMMSC member network API (utmmsc-api). The website keeps no accounts of its own: an officer signs
 * in with their member network account, and every admin request is checked against that account's current role.
 * The service binding is used when present; otherwise the API's public address.
 * 调用 UTMMSC 成员网络接口（utmmsc-api）。官网不保存自己的账号：干部使用成员网络账号登录，每个后台请求都会按该账号当前的身份进行检查。
 * 有服务绑定时使用服务绑定，否则使用接口的公开地址。
 */

/** The parts of the member network's MemberSelf the website reads. */
/** 官网读取的成员网络 MemberSelf 字段。 */
export interface MemberSummary {
  id: string;
  displayName: string;
  /** The role in effect, which for a system admin testing another office is that office. */
  /** 当前生效的身份；系统管理员测试其他职位时为该职位。 */
  role: string;
  status: string;
}

export type MemberLookup = { kind: 'member'; member: MemberSummary } | { kind: 'signed_out' } | { kind: 'unavailable' };

export type LoginOutcome =
  | { kind: 'signed_in'; token: string; expiresAt: string | null; member: MemberSummary }
  | { kind: 'refused'; status: 400 | 401 | 403 | 429; message: string }
  | { kind: 'unavailable' };

const REQUEST_TIMEOUT_MS = 8000;

function memberApiFetch(env: Env, path: string, init: RequestInit): Promise<Response> {
  const origin = env.MEMBER_API_ORIGIN.replace(/\/+$/, '');
  const request = new Request(`${origin}${path}`, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  return env.MEMBER_API ? env.MEMBER_API.fetch(request) : fetch(request);
}

function readMember(value: unknown): MemberSummary | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.role !== 'string') return null;
  return {
    id: record.id,
    displayName: typeof record.displayName === 'string' ? record.displayName : '',
    role: record.role,
    status: typeof record.status === 'string' ? record.status : 'active',
  };
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const body = (await response.json()) as unknown;
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The member a session token belongs to, as the member network sees it right now. */
/** 会话令牌所属的成员，以成员网络此刻的记录为准。 */
export async function lookupSessionMember(env: Env, token: string): Promise<MemberLookup> {
  let response: Response;
  try {
    response = await memberApiFetch(env, '/auth/me', { method: 'GET', headers: { authorization: `Bearer ${token}`, accept: 'application/json' } });
  } catch {
    return { kind: 'unavailable' };
  }
  if (response.status === 401 || response.status === 403) return { kind: 'signed_out' };
  if (!response.ok) return { kind: 'unavailable' };
  const member = readMember((await readJson(response))?.member);
  if (!member) return { kind: 'unavailable' };
  return member.status === 'active' ? { kind: 'member', member } : { kind: 'signed_out' };
}

function errorMessage(body: Record<string, unknown> | null, fallback: string): string {
  const error = body?.error;
  if (typeof error !== 'object' || error === null) return fallback;
  const message = (error as Record<string, unknown>).message;
  return typeof message === 'string' && message ? message : fallback;
}

/**
 * Signs in with the member network's email and password. The visitor's address is passed on so the member
 * network's per-address rate limit applies to the visitor, not to this Worker.
 * 使用成员网络的邮箱和密码登录。访问者的地址会一并转交，使成员网络按地址的限流作用于访问者本人，而不是本 Worker。
 */
export async function loginMember(env: Env, email: string, password: string, clientIp: string | null): Promise<LoginOutcome> {
  const headers: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json' };
  if (clientIp) headers['cf-connecting-ip'] = clientIp;
  let response: Response;
  try {
    response = await memberApiFetch(env, '/auth/login', { method: 'POST', headers, body: JSON.stringify({ email, password }) });
  } catch {
    return { kind: 'unavailable' };
  }
  const body = await readJson(response);
  if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 429) {
    return { kind: 'refused', status: response.status, message: errorMessage(body, '登录失败，请重试') };
  }
  if (!response.ok || !body) return { kind: 'unavailable' };
  const member = readMember(body.member);
  if (typeof body.token !== 'string' || !member) return { kind: 'unavailable' };
  return { kind: 'signed_in', token: body.token, expiresAt: typeof body.expiresAt === 'string' ? body.expiresAt : null, member };
}

/** Ends a member network session. Failures are ignored: the session then simply expires on its own. */
/** 结束一个成员网络会话。失败时忽略：该会话届时会自行过期。 */
export async function logoutMember(env: Env, token: string): Promise<void> {
  try {
    const response = await memberApiFetch(env, '/auth/logout', { method: 'POST', headers: { authorization: `Bearer ${token}` } });
    await response.body?.cancel();
  } catch {
    // The session expires on its own.
    // 会话会自行过期。
  }
}
