import { MEMBER_ROLE_LABELS, SITE_PERMISSIONS, isMemberRole, sitePermissionsFor, type AdminIdentity } from '@msc-web/content';

/**
 * Turns a member network account into a backend identity. Members whose role grants no site permission get null
 * and are refused at the door.
 * 把成员网络账号转换为后台身份。身份不带任何网站权限的成员得到 null，在入口即被拒绝。
 */
export function identityForMember(member: { id: string; displayName: string; role: string }): AdminIdentity | null {
  const permissions = sitePermissionsFor(member.role);
  if (permissions.length === 0) return null;
  return {
    memberId: member.id,
    displayName: member.displayName,
    role: member.role,
    roleLabel: isMemberRole(member.role) ? MEMBER_ROLE_LABELS[member.role] : { zh: member.role, en: member.role },
    permissions,
    source: 'member',
  };
}

export const DEVELOPER_IDENTITY: AdminIdentity = {
  memberId: 'developer',
  displayName: '本地开发者',
  role: 'superadmin',
  roleLabel: { zh: '本地开发者', en: 'Local developer' },
  permissions: [...SITE_PERMISSIONS],
  source: 'developer',
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Whether a request is addressed to this machine, the only place the developer token is honoured. */
/** 请求是否发往本机；只有本机会接受开发令牌。 */
export function isLocalRequest(url: URL): boolean {
  return LOCAL_HOSTS.has(url.hostname);
}

/** Constant-time comparison of two strings, so the developer token cannot be guessed byte by byte from timing. */
/** 以恒定时间比较两个字符串，防止通过计时逐字节猜出开发令牌。 */
export function timingSafeEqualText(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let difference = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return difference === 0;
}

/** At least 24 characters, so a short placeholder cannot be mistaken for a configured token. */
/** 至少 24 个字符，避免把简短的占位值误当作已配置的令牌。 */
export const MIN_DEVELOPER_TOKEN_LENGTH = 24;

export function developerSignInEnabled(token: string | undefined, url: URL): token is string {
  return typeof token === 'string' && token.length >= MIN_DEVELOPER_TOKEN_LENGTH && isLocalRequest(url);
}
