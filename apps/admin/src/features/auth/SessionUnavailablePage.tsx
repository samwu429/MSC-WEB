import { useSession } from '../../shared/session/SessionProvider';
import { Button } from '../../shared/ui/Button';
import { Notice } from '../../shared/ui/feedback';

/**
 * Shown when the stored sign-in could not be checked, for example offline or while the member network is down.
 * The sign-in is kept, so a retry once the connection is back lets the officer in without typing the password.
 * 无法核验已保存的登录时显示，例如离线或成员网络不可用时。登录会被保留，连接恢复后重试即可进入，无需再次输入密码。
 */
export function SessionUnavailablePage({ notice }: { notice: string }) {
  const { retryCheck } = useSession();
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Notice tone="warning" title="暂时无法验证登录">
          <p>{notice}</p>
          <p className="mt-1">你的登录仍然保留，网络或服务恢复后点击重试即可继续。</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={retryCheck}>
            重试
          </Button>
        </Notice>
      </div>
    </div>
  );
}
