import type { MemberLookup } from './client';

/**
 * A short in-memory cache of token checks, per Worker isolate. One admin screen makes several requests in a row;
 * without the cache each would ask the member network again. A demoted or signed-out officer keeps access for at
 * most TTL_MS. Tokens are kept only as SHA-256 digests.
 * 每个 Worker 隔离实例内的令牌校验短期缓存。一个后台页面会连续发出多个请求；没有缓存时每个请求都要重新询问成员网络。
 * 被撤职或已退出登录的干部最多在 TTL_MS 内仍保有权限。令牌只以 SHA-256 摘要形式保存。
 */
export const TTL_MS = 30_000;

const MAX_ENTRIES = 200;

interface Entry {
  lookup: Extract<MemberLookup, { kind: 'member' }>;
  expiresAt: number;
}

const entries = new Map<string, Entry>();

export async function tokenDigest(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * The cached member for a token, or a fresh lookup. Only successful lookups are cached, so a member network outage
 * or a rejected token is never remembered.
 * 返回令牌对应的缓存成员，或重新查询。只缓存成功的查询，成员网络故障或被拒绝的令牌永远不会被记住。
 */
export async function cachedLookup(token: string, lookup: () => Promise<MemberLookup>, now: number = Date.now()): Promise<MemberLookup> {
  const key = await tokenDigest(token);
  const hit = entries.get(key);
  if (hit && hit.expiresAt > now) return hit.lookup;
  if (hit) entries.delete(key);
  const fresh = await lookup();
  if (fresh.kind === 'member') {
    if (entries.size >= MAX_ENTRIES) {
      const oldest = entries.keys().next().value;
      if (oldest !== undefined) entries.delete(oldest);
    }
    entries.set(key, { lookup: fresh, expiresAt: now + TTL_MS });
  }
  return fresh;
}

/** Forgets a token at once, as on sign-out. */
/** 立即忘记一个令牌，例如退出登录时。 */
export async function forgetToken(token: string): Promise<void> {
  entries.delete(await tokenDigest(token));
}

/** For tests. */
/** 供测试使用。 */
export function clearSessionCache(): void {
  entries.clear();
}
