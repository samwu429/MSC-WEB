import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  PUBLISH_STATUSES,
  PUBLISH_STATUS_LABELS,
  pickText,
  timeStatus,
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

export const CATEGORY_FILTERS: readonly FilterOption<EventCategory>[] = [
  { value: undefined, label: '全部' },
  ...EVENT_CATEGORIES.map((category) => ({ value: category, label: EVENT_CATEGORY_LABELS[category].zh })),
];

export const STATUS_FILTERS: readonly FilterOption<PublishStatus>[] = [
  { value: undefined, label: '全部' },
  ...PUBLISH_STATUSES.map((status) => ({ value: status, label: PUBLISH_STATUS_LABELS[status].zh })),
];

function isOneOf<T extends string>(allowed: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/**
 * The event list's filters live in the address (?category=academic&status=draft), so returning from an event keeps
 * the same view. Values from the address are untrusted and anything unknown means "all".
 * 活动列表的筛选条件保存在地址中（?category=academic&status=draft），从某个活动返回时仍保持同样的视图。
 * 地址中的值不可信，任何未知值都视为 "全部"。
 */
export function parseEventFilter(params: URLSearchParams): EventListFilter {
  const category = params.get('category');
  const status = params.get('status');
  return {
    category: isOneOf(EVENT_CATEGORIES, category) ? category : undefined,
    status: isOneOf(PUBLISH_STATUSES, status) ? status : undefined,
  };
}

/** "2026-10-25 18:30": the stored Toronto wall time, shown without conversion. */
/** "2026-10-25 18:30"：直接显示保存的多伦多本地时间，不做换算。 */
export function formatWallTime(time: WallTime): string {
  return time.replace('T', ' ');
}

/** Whether an event is over, by the same rule the public site uses. */
/** 按公开网站使用的同一规则判断活动是否已结束。 */
export function hasEnded(event: Pick<SiteEvent, 'startsAt' | 'endsAt'>, now: WallTime): boolean {
  return timeStatus(event.startsAt, event.endsAt, now) === 'past';
}

export function eventListTitle(event: Pick<SiteEvent, 'title'>): string {
  return pickText(event.title, 'zh') || '未命名活动';
}

export function sortNewestFirst(events: readonly SiteEvent[]): SiteEvent[] {
  return [...events].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}
