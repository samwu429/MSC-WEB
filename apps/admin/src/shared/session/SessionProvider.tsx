import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminIdentity, SitePermission } from '@msc-web/content';
import { setApiToken, setSessionLostHandler } from '../api/client';
import { sessionApi } from '../api/endpoints';
import { isAnotherMember, startupFailure } from './session-checks';
import { clearSession, loadSession, saveSession, type SessionSource, type StoredSession } from './storage';

/**
 * `unavailable`: the stored sign-in could not be checked and is kept until a retry succeeds or is refused.
 * `expired`: the server stopped accepting the token while the officer was working; the screens stay mounted under
 * a sign-in dialog, so a draft survives and can be saved again once the officer signs in.
 * `unavailable`：无法核验已保存的登录，登录会一直保留，直到重试成功或被拒绝。
 * `expired`：干部工作期间服务器不再接受该令牌；页面保持挂载，上方显示登录对话框，草稿因此得以保留，重新登录后可以再次保存。
 */
export type SessionState =
  | { status: 'checking' }
  | { status: 'unavailable'; notice: string }
  | { status: 'signed-out'; notice: string | null }
  | { status: 'signed-in'; identity: AdminIdentity; token: string; source: SessionSource; expired: boolean };

interface SessionContextValue {
  state: SessionState;
  signIn(email: string, password: string): Promise<void>;
  signInAsDeveloper(token: string): Promise<void>;
  signOut(): Promise<void>;
  retryCheck(): void;
  can(permission: SitePermission): boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Holds who is signed in. On start it checks the stored session with the server, because the officer's role may
 * have changed in the member network since the last visit.
 * 保存当前登录者。启动时向服务器核验已保存的会话，因为自上次访问以来，干部在成员网络中的身份可能已经变化。
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<SessionState>({ status: 'checking' });

  const enter = useCallback((token: string, source: SessionSource, identity: AdminIdentity) => {
    setApiToken(token);
    saveSession({ token, source });
    setState({ status: 'signed-in', identity, token, source, expired: false });
  }, []);

  const leave = useCallback((notice: string | null) => {
    setApiToken(null);
    clearSession();
    setState({ status: 'signed-out', notice });
  }, []);

  const check = useCallback(
    (stored: StoredSession) => {
      let cancelled = false;
      setState({ status: 'checking' });
      sessionApi
        .current(stored.token)
        .then(({ identity }) => {
          if (!cancelled) enter(stored.token, stored.source, identity);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          const failure = startupFailure(error, stored.source);
          if (failure.kind === 'unavailable') {
            setState({ status: 'unavailable', notice: failure.notice });
            return;
          }
          if (failure.logout) void sessionApi.logout(stored.token).catch(() => undefined);
          leave(failure.notice);
        });
      return () => {
        cancelled = true;
      };
    },
    [enter, leave],
  );

  const start = useCallback(() => {
    const stored = loadSession();
    if (stored) return check(stored);
    setState({ status: 'signed-out', notice: null });
    return undefined;
  }, [check]);

  useEffect(() => start(), [start]);

  useEffect(() => {
    setSessionLostHandler(() => setState((current) => (current.status === 'signed-in' ? { ...current, expired: true } : current)));
    return () => setSessionLostHandler(null);
  }, []);

  const signedIn = useCallback(
    (token: string, source: SessionSource, identity: AdminIdentity) => {
      const reset = isAnotherMember(state.status === 'signed-in' ? state.identity : null, identity);
      enter(token, source, identity);
      if (reset) navigate('/', { replace: true });
    },
    [enter, navigate, state],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await sessionApi.login(email, password);
      signedIn(response.token, 'backend', response.identity);
    },
    [signedIn],
  );

  const signInAsDeveloper = useCallback(
    async (token: string) => {
      const { identity } = await sessionApi.current(token);
      signedIn(token, 'developer', identity);
    },
    [signedIn],
  );

  const signOut = useCallback(async () => {
    if (state.status === 'signed-in' && state.source !== 'member-app') {
      await sessionApi.logout(state.token).catch(() => undefined);
    }
    leave(null);
  }, [leave, state]);

  const retryCheck = useCallback(() => {
    start();
  }, [start]);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      signIn,
      signInAsDeveloper,
      signOut,
      retryCheck,
      can: (permission) => state.status === 'signed-in' && state.identity.permissions.includes(permission),
    }),
    [state, signIn, signInAsDeveloper, signOut, retryCheck],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

/** The signed-in identity, for screens that only render inside the signed-in shell. */
/** 当前登录身份，供只在登录后外壳中渲染的页面使用。 */
export function useIdentity(): AdminIdentity {
  const { state } = useSession();
  if (state.status !== 'signed-in') throw new Error('useIdentity requires a signed-in session');
  return state.identity;
}
