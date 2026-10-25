import type { AdminIdentity } from '@msc-web/content';
import { ApiError } from '../api/client';
import type { SessionSource } from './storage';

/**
 * What a failed startup check of the stored sign-in leads to. Only 401 and 403 mean the server refused the session.
 * Any other failure (no network, the member network down, a server error) says nothing about the session, so the
 * stored sign-in is kept and the check can be repeated.
 * 启动时核验已保存登录失败后的处理。只有 401 与 403 表示服务器拒绝了该会话。其他失败（没有网络、成员网络不可用、服务器出错）
 * 并不说明会话本身有问题，因此保留已保存的登录，并可以再次核验。
 */
export type StartupFailure =
  | { kind: 'refused'; notice: string | null; logout: boolean }
  | { kind: 'unavailable'; notice: string };

export function startupFailure(error: unknown, source: SessionSource): StartupFailure {
  if (!(error instanceof ApiError)) return { kind: 'unavailable', notice: '暂时无法验证登录，请稍后重试' };
  if (error.status !== 401 && error.status !== 403) return { kind: 'unavailable', notice: error.message };
  const borrowed = source === 'member-app';
  if (error.status === 401) return { kind: 'refused', notice: borrowed ? null : error.message, logout: false };
  return {
    kind: 'refused',
    notice: borrowed ? '你的成员网络账号没有官网后台权限，可换一个干部账号登录' : error.message,
    // A session this backend created is ended, so a member who lost their office keeps no live session made here;
    // a borrowed one belongs to the member app, which alone signs its members out.
    // 由本后台创建的会话会被结束，失去职位的成员因此不会留下在这里创建的有效会话；借用的会话属于成员网络应用，只由它让成员退出。
    logout: source === 'backend',
  };
}

/**
 * Whether signing in again after an expired session brings in a different member. The open screens hold the
 * previous member's drafts, so they are reset instead of handed over.
 * 会话过期后重新登录的是否为另一位成员。打开的页面中是上一位成员的草稿，因此会被重置，而不是交给新的成员。
 */
export function isAnotherMember(previous: AdminIdentity | null, next: AdminIdentity): boolean {
  return previous !== null && previous.memberId !== next.memberId;
}
