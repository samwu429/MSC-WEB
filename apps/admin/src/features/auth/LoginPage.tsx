import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { SessionOptionsResponse } from '@msc-web/content';
import { sessionApi } from '../../shared/api/endpoints';
import { errorMessage } from '../../shared/forms/issues';
import { useSession } from '../../shared/session/SessionProvider';
import { Button } from '../../shared/ui/Button';
import { Notice } from '../../shared/ui/feedback';

const INPUT = 'block w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200';

/**
 * A modal dialog over the open screens. The session stays expired until the officer signs in again or signs out,
 * so the dialog cannot be dismissed, and a browser that closes it anyway gets it reopened.
 * 覆盖在已打开页面之上的模态对话框。在干部重新登录或退出之前会话一直处于过期状态，因此对话框无法关闭；即使浏览器强行关闭，也会重新打开。
 */
function ModalDialog({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={labelledBy}
      onCancel={(event) => event.preventDefault()}
      onClose={(event) => {
        if (!event.currentTarget.open) event.currentTarget.showModal();
      }}
      className="w-full max-w-md rounded-2xl bg-canvas p-6 shadow-xl backdrop:bg-ink/50"
    >
      {children}
    </dialog>
  );
}

/**
 * Sign-in with the member network account. Only officers get in; the server checks the role on every request.
 * On a local machine with DEV_ADMIN_TOKEN set, a developer token can be used instead. With `expired`, it is shown
 * as a dialog over the screen the officer was working on, which keeps its unsaved edits.
 * 使用成员网络账号登录。只有干部可以进入；服务器在每个请求上都会检查身份。在设置了 DEV_ADMIN_TOKEN 的本机上，也可以改用开发令牌。
 * 设置 `expired` 时，以对话框形式显示在干部正在编辑的页面之上，该页面未保存的修改会保留。
 */
export function LoginPage({ expired = false }: { expired?: boolean }) {
  const { state, signIn, signInAsDeveloper, signOut } = useSession();
  const titleId = useId();
  const [options, setOptions] = useState<SessionOptionsResponse | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [developerToken, setDeveloperToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sessionApi.options().then(setOptions, () => setOptions(null));
  }, []);

  const notice = state.status === 'signed-out' ? state.notice : null;
  const Heading = expired ? 'h2' : 'h1';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function submitDeveloper(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInAsDeveloper(developerToken.trim());
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  const memberAppUrl = options?.memberAppUrl ?? '/UTMMSC/';

  const content = (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <svg className="mx-auto h-12 w-16" viewBox="0 0 168 132" aria-hidden="true">
          <path d="M 0 132 L 0 6 L 74 30 L 74 132 Z" fill="#5B2A86" />
          <path d="M 94 132 L 94 30 L 168 6 L 168 132 Z" fill="#5B2A86" />
          <rect x="16" y="46" width="40" height="4" fill="#FFD23F" />
          <rect x="16" y="64" width="40" height="4" fill="#FFD23F" />
          <rect x="16" y="82" width="40" height="4" fill="#FFD23F" />
          <rect x="112" y="46" width="40" height="4" fill="#FFD23F" />
          <rect x="112" y="64" width="40" height="4" fill="#FFD23F" />
          <rect x="112" y="82" width="40" height="4" fill="#FFD23F" />
        </svg>
        <Heading id={titleId} className="mt-4 font-serif text-2xl font-bold text-brand-900">
          {expired ? '登录已过期' : 'UTMMSC 官网后台'}
        </Heading>
        <p className="mt-2 text-sm text-ink-muted">
          {expired ? '请重新登录。本页尚未保存的修改仍会保留，登录后再保存一次即可。' : '使用成员网络账号登录。只有主席团、部长等干部可以进入。'}
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
        {notice && <Notice tone="warning">{notice}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
              邮箱
            </label>
            <input id="email" type="email" autoComplete="username" required className={INPUT} value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
              密码
            </label>
            <input id="password" type="password" autoComplete="current-password" required className={INPUT} value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <Button type="submit" busy={busy} className="w-full">
            登录
          </Button>
        </form>
        <p className="text-center text-xs text-ink-muted">
          还没有账号或忘记密码？请在
          <a className="mx-1 font-semibold text-brand-700 hover:underline" href={memberAppUrl}>
            成员网络
          </a>
          注册或重置。
        </p>
      </div>

      {options?.developerSignIn && (
        <form className="mt-6 space-y-3 rounded-2xl border border-dashed border-gold-600/50 bg-gold-100/60 p-5" onSubmit={(event) => void submitDeveloper(event)}>
          <p className="text-sm font-semibold text-ink">本地开发登录</p>
          <p className="text-xs text-ink-muted">仅在本机开发时出现。令牌为 apps/site/.dev.vars 中的 DEV_ADMIN_TOKEN。</p>
          <input type="password" aria-label="开发令牌" autoComplete="off" className={INPUT} value={developerToken} onChange={(event) => setDeveloperToken(event.target.value)} />
          <Button type="submit" variant="secondary" busy={busy} className="w-full">
            以开发者身份进入
          </Button>
        </form>
      )}

      {expired && (
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void signOut()}>
            放弃未保存的修改并退出后台
          </Button>
        </div>
      )}
    </div>
  );

  if (expired) return <ModalDialog labelledBy={titleId}>{content}</ModalDialog>;
  return <div className="flex min-h-screen items-center justify-center px-4 py-12">{content}</div>;
}
