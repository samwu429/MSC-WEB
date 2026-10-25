/**
 * Where the backend keeps its sign-in. A sign-in made on this backend is stored under its own key. An officer who
 * is already signed in to the member network (same origin, key utmmsc.session) is let in with that session too,
 * read-only: signing out here only stops using it and never signs them out of the member network.
 * 后台保存登录状态的位置。在本后台完成的登录保存在独立的键下。已登录成员网络（同源，键为 utmmsc.session）的干部也可以直接使用该会话进入，
 * 但只读取不修改：在这里退出只会停止使用该会话，永远不会让其退出成员网络。
 */

export type SessionSource = 'backend' | 'member-app' | 'developer';

export interface StoredSession {
  token: string;
  source: SessionSource;
}

const BACKEND_KEY = 'msc-web.admin.session';
const MEMBER_APP_KEY = 'utmmsc.session';
/** Set for the rest of the browser tab once the officer chose not to use the member network session. */
/** 干部选择不使用成员网络会话后，在当前标签页剩余时间内保持设置。 */
const SKIP_MEMBER_APP_KEY = 'msc-web.admin.skip-member-session';

function safeGet(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(storage: Storage | undefined, key: string, value: string | null): void {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing; the session then lasts for this page only.
    // 隐私浏览模式下存储可能不可用；此时会话只在当前页面有效。
  }
}

function local(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function sessionScoped(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.sessionStorage;
}

/** The token the member network app stores (zustand persist: { state: { token } }). */
/** 成员网络应用保存的令牌（zustand persist 格式：{ state: { token } }）。 */
export function readMemberAppToken(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { token?: unknown } };
    const token = parsed.state?.token;
    return typeof token === 'string' && token ? token : null;
  } catch {
    return null;
  }
}

export function loadSession(): StoredSession | null {
  const own = safeGet(local(), BACKEND_KEY);
  if (own) {
    try {
      const parsed = JSON.parse(own) as Partial<StoredSession>;
      if (typeof parsed.token === 'string' && (parsed.source === 'backend' || parsed.source === 'developer')) return { token: parsed.token, source: parsed.source };
    } catch {
      safeSet(local(), BACKEND_KEY, null);
    }
  }
  if (safeGet(sessionScoped(), SKIP_MEMBER_APP_KEY) === '1') return null;
  const memberToken = readMemberAppToken(safeGet(local(), MEMBER_APP_KEY));
  return memberToken ? { token: memberToken, source: 'member-app' } : null;
}

export function saveSession(session: StoredSession): void {
  if (session.source === 'member-app') return;
  safeSet(local(), BACKEND_KEY, JSON.stringify(session));
  safeSet(sessionScoped(), SKIP_MEMBER_APP_KEY, null);
}

/** Forgets the backend's own sign-in, and stops borrowing the member network session for this tab. */
/** 忘记后台自己的登录，并在当前标签页停止借用成员网络会话。 */
export function clearSession(): void {
  safeSet(local(), BACKEND_KEY, null);
  safeSet(sessionScoped(), SKIP_MEMBER_APP_KEY, '1');
}
