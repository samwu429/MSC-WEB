import { summaryApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { Spinner } from '../../shared/ui/feedback';
import { PageHeader } from '../../shared/ui/layout';
import { RecentChanges } from './recent-changes/RecentChanges';

/**
 * /changes: the latest changes to the site, its own page so the dashboard stays short. Every officer may read it.
 * /changes：网站的最近修改，单独成页，使概览页保持简短。所有干部都可以查看。
 */
export function ChangesPage() {
  const { state, reload } = useLoad(() => summaryApi.get(), []);
  return (
    <>
      <PageHeader title="最近修改" description="最近 20 条修改，最新的在最上面。时间为多伦多时间。" />
      {state.status === 'loading' && <Spinner label="正在加载修改记录" />}
      {state.status === 'error' && <LoadFailedNotice title="无法加载修改记录" error={state.error} onRetry={reload} />}
      {state.status === 'ready' && <RecentChanges changes={state.data.recentChanges} />}
    </>
  );
}
