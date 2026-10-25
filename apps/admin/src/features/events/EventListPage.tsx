import { useSearchParams } from 'react-router-dom';
import { torontoWallTime } from '@msc-web/content';
import { eventsApi, filterSearchParams, type EventListFilter } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { LinkButton } from '../../shared/ui/Button';
import { EmptyState, Spinner } from '../../shared/ui/feedback';
import { PageHeader } from '../../shared/ui/layout';
import { EventRows } from './list/EventRows';
import { FilterButtons } from './list/FilterButtons';
import { CATEGORY_FILTERS, STATUS_FILTERS, parseEventFilter, sortNewestFirst } from './list/event-list';

export function EventListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = parseEventFilter(searchParams);
  const { state, reload } = useLoad(() => eventsApi.list(filter).then(({ events }) => sortNewestFirst(events)), [filter.category, filter.status]);
  const filtered = filter.category !== undefined || filter.status !== undefined;

  function applyFilter(next: EventListFilter) {
    setSearchParams(filterSearchParams(next), { replace: true });
  }

  return (
    <>
      <PageHeader
        title="活动"
        description="学术活动与课外活动。草稿只在后台可见，发布后才会出现在网站上。"
        actions={
          <LinkButton to="/events/new" variant="primary">
            新建活动
          </LinkButton>
        }
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
        <FilterButtons label="类别" value={filter.category} options={CATEGORY_FILTERS} onChange={(category) => applyFilter({ ...filter, category })} />
        <FilterButtons label="状态" value={filter.status} options={STATUS_FILTERS} onChange={(status) => applyFilter({ ...filter, status })} />
      </div>
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <LoadFailedNotice error={state.error} onRetry={reload} />}
      {state.status === 'ready' &&
        (state.data.length > 0 ? (
          <EventRows events={state.data} now={torontoWallTime(new Date())} />
        ) : filtered ? (
          <EmptyState title="没有符合条件的活动">可以换一个筛选条件。</EmptyState>
        ) : (
          <EmptyState title="还没有活动">点击「新建活动」添加第一个活动。</EmptyState>
        ))}
    </>
  );
}
