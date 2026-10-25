import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * A confirmation carried in the navigation state, so the page a new record opens on, or the page shown after a
 * delete, can say what just happened.
 * 随导航状态传递的确认信息，新记录打开的页面或删除后显示的页面因此可以说明刚刚发生了什么。
 */
interface ArrivalState {
  notice: string;
}

export function withNotice(notice: string): ArrivalState {
  return { notice };
}

export function noticeOf(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null;
  const notice = (state as Partial<ArrivalState>).notice;
  return typeof notice === 'string' ? notice : null;
}

/**
 * Reads the confirmation once, when the calling component mounts, then removes it from the history entry, so a
 * browser refresh or a form keyed again after a conflict reload does not repeat it. A component that was already on
 * screen when the navigation happened leaves the confirmation to the one that mounts for the new address.
 * 在调用它的组件挂载时读取一次确认信息，随后将其从历史记录中移除，因此浏览器刷新或冲突后重新加载的表单都不会再次显示。
 * 导航发生时已在屏幕上的组件不会取走确认信息，而是留给为新地址挂载的组件。
 */
export function useArrivalNotice(): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const [notice] = useState(() => noticeOf(location.state));

  useEffect(() => {
    if (notice) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return notice;
}
