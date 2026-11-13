import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { torontoWallTime } from '@msc-web/content';
import { eventsApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { matchesSearch } from '../../shared/data/search';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { LinkButton } from '../../shared/ui/Button';
import { EmptyState, Spinner } from '../../shared/ui/feedback';
import { SearchInput } from '../../shared/ui/fields';
import { PageHeader } from '../../shared/ui/layout';
import { EventRows } from './list/EventRows';
import { FilterButtons } from './list/FilterButtons';
import {
  ARCHIVE_FILTERS,
  CATEGORY_FILTERS,
  STATUS_FILTERS,
  eventListSearchParams,
  inArchiveView,
  inCategoryFilter,
  parseArchiveView,
  parseCategoryFilter,
  parseEventFilter,
  sortNewestFirst,
  type EventListView,
} from './list/event-list';

export function EventListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = parseEventFilter(searchParams);
  const { state, reload } = useLoad(() => eventsApi.list(filter).then(({ events }) => sortNewestFirst(events)), [filter.category, filter.status]);
  const [query, setQuery] = useState('');
  const view: EventListView = { category: parseCategoryFilter(searchParams), status: filter.status, archive: parseArchiveView(searchParams) };
  const filtered = view.category !== undefined || view.status !== undefined || view.archive !== undefined || query.trim() !== '';
  const shown =
    state.status === 'ready'
      ? state.data.filter(
          (event) =>
            inCategoryFilter(event, view.category) &&
            inArchiveView(event, view.archive) &&
            matchesSearch(query, [event.title.zh, event.title.en, event.slug]),
        )
      : [];

  function applyFilter(change: EventListView) {
    setSearchParams(eventListSearchParams({ ...view, ...change }), { replace: true });
  }

  return (
    <>
      <PageHeader
        title="活动"
        description="学术活动（包括兴趣课）与课外活动。草稿只在后台可见，发布后才会出现在网站上。"
        actions={
          <LinkButton to="/events/new" variant="primary">
            新建活动
          </LinkButton>
        }
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
        <FilterButtons label="类别" value={view.category} options={CATEGORY_FILTERS} onChange={(category) => applyFilter({ category })} />
        <FilterButtons label="状态" value={view.status} options={STATUS_FILTERS} onChange={(status) => applyFilter({ status })} />
        <FilterButtons label="进度" value={view.archive} options={ARCHIVE_FILTERS} onChange={(archive) => applyFilter({ archive })} />
        <SearchInput label="搜索活动" value={query} onChange={setQuery} placeholder="搜索标题或链接名" className="sm:ml-auto sm:w-64" />
      </div>
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <LoadFailedNotice error={state.error} onRetry={reload} />}
      {state.status === 'ready' &&
        (shown.length > 0 ? (
          <EventRows events={shown} now={torontoWallTime(new Date())} />
        ) : filtered ? (
          <EmptyState title="没有符合条件的活动">可以换一个筛选条件或搜索词。</EmptyState>
        ) : (
          <EmptyState title="还没有活动">点击「新建活动」添加第一个活动。</EmptyState>
        ))}
    </>
  );
}
