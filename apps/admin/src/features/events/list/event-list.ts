import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  INTEREST_CLASS_LABEL,
  PUBLISH_STATUSES,
  PUBLISH_STATUS_LABELS,
  eventStatus,
  isInterestClass,
  pickText,
  type EventCategory,
  type PublishStatus,
  type SiteEvent,
  type WallTime,
} from '@msc-web/content';
import type { EventListFilter } from '../../../shared/api/endpoints';

export interface FilterOption<T extends string> {
  value: T | undefined;
  label: string;
}

/**
 * The category buttons: the two categories, and 兴趣课, which is not a category of its own but the academic events
 * marked as interest classes. The address keeps it as ?category=interest; the server is asked for academic events
 * and the list keeps the interest classes among them.
 * 类别按钮：两个类别，以及 "兴趣课"。兴趣课不是独立的类别，而是被标记为兴趣课的学术活动。地址中以 ?category=interest 保存；
 * 向服务器请求学术活动，列表再从中保留兴趣课。
 */
export type CategoryFilter = EventCategory | 'interest';

export const CATEGORY_FILTERS: readonly FilterOption<CategoryFilter>[] = [
  { value: undefined, label: '全部' },
  ...EVENT_CATEGORIES.map((category) => ({ value: category, label: EVENT_CATEGORY_LABELS[category].zh })),
  { value: 'interest', label: INTEREST_CLASS_LABEL.zh },
];

export const STATUS_FILTERS: readonly FilterOption<PublishStatus>[] = [
  { value: undefined, label: '全部' },
  ...PUBLISH_STATUSES.map((status) => ({ value: status, label: PUBLISH_STATUS_LABELS[status].zh })),
];

function isOneOf<T extends string>(allowed: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/** The category button the address selects; anything unknown means "all". */
/** 地址所选的类别按钮；任何未知值都视为 "全部"。 */
export function parseCategoryFilter(params: URLSearchParams): CategoryFilter | undefined {
  const category = params.get('category');
  return category === 'interest' || isOneOf(EVENT_CATEGORIES, category) ? category : undefined;
}

/**
 * The event list's filters live in the address (?category=academic&status=draft), so returning from an event keeps
 * the same view. Values from the address are untrusted and anything unknown means "all". This is what the server is
 * asked for, so 兴趣课 asks for academic events.
 * 活动列表的筛选条件保存在地址中（?category=academic&status=draft），从某个活动返回时仍保持同样的视图。
 * 地址中的值不可信，任何未知值都视为 "全部"。这是向服务器请求的条件，因此 "兴趣课" 请求的是学术活动。
 */
export function parseEventFilter(params: URLSearchParams): EventListFilter {
  const category = parseCategoryFilter(params);
  const status = params.get('status');
  return {
    category: category === 'interest' ? 'academic' : category,
    status: isOneOf(PUBLISH_STATUSES, status) ? status : undefined,
  };
}

/** Whether an event the server sent belongs under the category button: under 兴趣课, only interest classes do. */
/** 服务器返回的活动是否属于所选类别按钮：选中 "兴趣课" 时只保留兴趣课。 */
export function inCategoryFilter(event: Pick<SiteEvent, 'category' | 'interestClass'>, filter: CategoryFilter | undefined): boolean {
  return filter !== 'interest' || isInterestClass(event);
}

/** "2026-10-25 18:30": the stored Toronto wall time, shown without conversion. */
/** "2026-10-25 18:30"：直接显示保存的多伦多本地时间，不做换算。 */
export function formatWallTime(time: WallTime): string {
  return time.replace('T', ' ');
}

/** Whether an event is over, by the same rule the public site uses: past its time, or marked as ended. */
/** 按公开网站使用的同一规则判断活动是否已结束：时间已过，或已被标记为已结束。 */
export function hasEnded(event: Pick<SiteEvent, 'startsAt' | 'endsAt' | 'archived'>, now: WallTime): boolean {
  return eventStatus(event, now) === 'past';
}

/** Which events the list shows: those still running (the default), those marked as ended, or all. */
/** 列表显示哪些活动：仍在进行的（默认）、已标记为已结束的，或全部。 */
export type ArchiveView = 'archived' | 'all';

export const ARCHIVE_FILTERS: readonly FilterOption<ArchiveView>[] = [
  { value: undefined, label: '未结束' },
  { value: 'archived', label: '已结束' },
  { value: 'all', label: '全部' },
];

export function parseArchiveView(params: URLSearchParams): ArchiveView | undefined {
  const view = params.get('archive');
  return view === 'archived' || view === 'all' ? view : undefined;
}

export function inArchiveView(event: Pick<SiteEvent, 'archived'>, view: ArchiveView | undefined): boolean {
  if (view === 'all') return true;
  return view === 'archived' ? event.archived : !event.archived;
}

/** What the list shows, as its address keeps it. */
/** 列表显示的内容，与其地址中保存的一致。 */
export interface EventListView {
  category?: CategoryFilter;
  status?: PublishStatus;
  archive?: ArchiveView;
}

/** The list page's address for a view, leaving out every filter that shows all. */
/** 某一视图对应的列表页面地址，不包含显示全部的筛选条件。 */
export function eventListSearchParams(view: EventListView): URLSearchParams {
  const params = new URLSearchParams();
  if (view.category) params.set('category', view.category);
  if (view.status) params.set('status', view.status);
  if (view.archive) params.set('archive', view.archive);
  return params;
}

export function eventListTitle(event: Pick<SiteEvent, 'title'>): string {
  return pickText(event.title, 'zh') || '未命名活动';
}

export function sortNewestFirst(events: readonly SiteEvent[]): SiteEvent[] {
  return [...events].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}
