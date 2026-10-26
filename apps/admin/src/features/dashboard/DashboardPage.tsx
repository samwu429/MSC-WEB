import { pickText } from '@msc-web/content';
import { summaryApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { useIdentity } from '../../shared/session/SessionProvider';
import { buttonClass } from '../../shared/ui/Button';
import { Spinner } from '../../shared/ui/feedback';
import { PageHeader } from '../../shared/ui/layout';
import { QuickActions } from './quick-actions/QuickActions';
import { SummaryCards } from './summary/SummaryCards';
import { summaryCards } from './summary/summary-cards';

/**
 * The landing page after sign-in: counts for the sections this officer may edit and shortcuts to the most common
 * tasks. The shared change history has a page of its own, /changes.
 * 登录后的首页：该干部可编辑板块的数量统计与常用操作的快捷入口。共享的修改记录单独成页，位于 /changes。
 */
export function DashboardPage() {
  const identity = useIdentity();
  const { state, reload } = useLoad(() => summaryApi.get(), []);
  const role = pickText(identity.roleLabel, 'zh');

  return (
    <>
      <PageHeader
        title={identity.displayName ? `你好，${identity.displayName}` : '你好'}
        description={role ? `${role} · UTMMSC 官网编辑后台` : 'UTMMSC 官网编辑后台'}
        actions={
          <a href="/" target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
            查看网站
            <span className="sr-only">（在新标签页中打开）</span>
          </a>
        }
      />
      <div className="space-y-6">
        {state.status === 'loading' && <Spinner label="正在加载概览" />}
        {state.status === 'error' && <LoadFailedNotice title="无法加载概览" error={state.error} onRetry={reload} />}
        {state.status === 'ready' && <SummaryCards cards={summaryCards(state.data.counts, identity.permissions)} />}
        <QuickActions />
      </div>
    </>
  );
}
