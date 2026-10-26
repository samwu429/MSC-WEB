import { EVENT_CATEGORY_LABELS, formatTimeRange, timeStatus, wallDateOf, type SiteEvent } from '@msc-web/content';
import type { PageContext } from '../context';
import { Bi, DateBox, MediaImage, MetaItem, StatusChip, fallbackLang, txt } from '../components/common';
import { BookMark } from '../components/Icon';
import { sitePath } from '../routing/paths';

/** The address of an event's own page. */
/** 活动详情页的地址。 */
export function eventHref(event: Pick<SiteEvent, 'slug'>): string {
  return sitePath(`/events/${event.slug}`);
}

/**
 * An event as a card. The title link stretches over the whole card, so the cover is decorative and has empty alt
 * text; the status chip appears only once the event is under way or over, since "upcoming" is the default.
 * 以卡片形式展示的活动。标题链接覆盖整张卡片，因此封面是装饰性的，替代文字为空；状态标签只在活动进行中或已结束时显示，
 * 因为 "即将开始" 是默认状态。
 */
export function EventCard(props: { event: SiteEvent; ctx: PageContext }) {
  const { event, ctx } = props;
  const { locale } = ctx;
  const status = timeStatus(event.startsAt, event.endsAt, ctx.now);
  const location = txt(event.location, locale);
  const summary = event.summary.en.trim() || event.summary.zh.trim();
  const summaryZh = event.summary.en.trim() ? event.summary.zh.trim() : '';
  return (
    <article class="card card--link">
      <div class="card__media">
        {event.coverKey ? (
          <MediaImage mediaKey={event.coverKey} alt="" />
        ) : (
          <div class={event.category === 'extracurricular' ? 'card__placeholder card__placeholder--teal' : 'card__placeholder'}>
            <BookMark light />
          </div>
        )}
        <div class="card__badges">
          <span class={`chip chip--${event.category}`}>{txt(EVENT_CATEGORY_LABELS[event.category], locale)}</span>
          {(status === 'ongoing' || status === 'past') && <StatusChip status={status} locale={locale} />}
        </div>
      </div>
      <div class="card__body">
        {/* A plain wrapper keeps the date badge at its own width inside the column layout of the card body. */}
        {/* 普通的外层元素让日期徽章在卡片正文的纵向布局中保持自身宽度。 */}
        <div>
          <DateBox date={wallDateOf(event.startsAt)} locale={locale} />
        </div>
        <h3 class="card__title">
          <a class="card__link" href={eventHref(event)}>
            <Bi text={event.title} />
          </a>
        </h3>
        <div class="meta">
          <MetaItem icon="clock" text={formatTimeRange(event.startsAt, event.endsAt, locale, ctx.currentYear)} />
          {location && <MetaItem icon="pin" text={location} lang={fallbackLang(event.location, locale)} />}
        </div>
        {summary && (
          <p class="card__text" lang={fallbackLang(event.summary, locale)}>
            {summary}
          </p>
        )}
        {summaryZh && summaryZh !== summary && (
          <p class="card__text zh-text" lang="zh-CN">
            {summaryZh}
          </p>
        )}
      </div>
    </article>
  );
}
