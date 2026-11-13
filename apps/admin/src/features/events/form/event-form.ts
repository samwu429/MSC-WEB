import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  emptyText,
  isInterestClass,
  type EventCategory,
  type EventInput,
  type PublishStatus,
  type SiteEvent,
} from '@msc-web/content';

export const CATEGORY_OPTIONS: readonly { value: EventCategory; label: string }[] = EVENT_CATEGORIES.map((category) => ({
  value: category,
  label: EVENT_CATEGORY_LABELS[category].zh,
}));

export const STATUS_OPTIONS: readonly { value: PublishStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '发布' },
];

/** A new event starts as a draft, so nothing reaches the public site before the editor publishes it. */
/** 新活动以草稿开始，编辑者发布之前不会有任何内容出现在公开网站上。 */
export function emptyEventInput(): EventInput {
  return {
    slug: '',
    category: 'academic',
    status: 'draft',
    title: emptyText(),
    summary: emptyText(),
    body: emptyText(),
    startsAt: '',
    endsAt: null,
    location: emptyText(),
    coverKey: null,
    registrationUrl: null,
    archived: false,
    interestClass: false,
  };
}

/** The editable fields of a stored event; the photo gallery is edited separately and never sent with it. */
/** 已保存活动的可编辑字段；相册单独编辑，不随活动一起发送。 */
export function toEventInput(event: SiteEvent): EventInput {
  return {
    slug: event.slug,
    category: event.category,
    status: event.status,
    title: event.title,
    summary: event.summary,
    body: event.body,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: event.location,
    coverKey: event.coverKey,
    registrationUrl: event.registrationUrl,
    archived: event.archived,
    // A mark left on an event of another category (possible only through a direct database edit) is dropped, so the
    // form can still save the event.
    // 其他类别活动上残留的兴趣课标记（只可能来自直接修改数据库）会被去掉，表单因此仍可保存该活动。
    interestClass: isInterestClass(event),
  };
}

/**
 * The fields a change of category sets. Only an academic event can be an interest class, so choosing another
 * category also clears the mark; choosing 学术活动 again leaves it cleared.
 * 更改类别时设置的字段。只有学术活动可以是兴趣课，因此选择其他类别时会同时取消兴趣课标记；再次选择学术活动时标记保持取消。
 */
export function categoryChange(category: EventCategory): Pick<EventInput, 'category'> & Partial<Pick<EventInput, 'interestClass'>> {
  return category === 'academic' ? { category } : { category, interestClass: false };
}

/** The Chinese public page of an event; the English page is the same path under /en. */
/** 活动的中文公开页面；英文页面为 /en 下的相同路径。 */
export function publicEventPath(slug: string): string {
  return `/events/${encodeURIComponent(slug)}`;
}
