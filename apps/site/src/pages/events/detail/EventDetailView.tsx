import { EVENT_CATEGORY_LABELS, formatTimeRange, mediaUrl, timeStatus, type SiteEventDetail } from '@msc-web/content';
import type { PageContext } from '../../context';
import { Bi, BiRichText, BiText, MediaImage, MetaItem, SectionHeading, StatusChip, fallbackLang, txt } from '../../components/common';
import { Icon } from '../../components/Icon';
import { COMMON, t } from '../../i18n/strings';
import { sitePath } from '../../routing/paths';
import { EVENTS } from '../strings';

const TITLE_ID = 'event-title';
const PHOTOS_ID = 'event-photos';

function InfoRow({ label, value, lang }: { label: string; value: string; lang?: string }) {
  return (
    <div class="info-list__row">
      <span class="info-list__label">{label}</span>
      <span class="info-list__value" lang={lang}>
        {value}
      </span>
    </div>
  );
}

/** Each photo links to the full image; a photo without a caption is described by the event title and its number. */
/** 每张照片都链接到原图；没有说明的照片以活动标题加序号作为替代文字。 */
function Gallery({ event, ctx }: { event: SiteEventDetail; ctx: PageContext }) {
  const { locale } = ctx;
  const title = txt(event.title, locale);
  return (
    <section aria-labelledby={PHOTOS_ID}>
      <SectionHeading id={PHOTOS_ID} title={EVENTS.photosTitle} />
      <div class="gallery">
        {event.photos.map((photo, index) => {
          const caption = txt(photo.caption, locale);
          return (
            <figure class="gallery__item" lang={caption ? fallbackLang(photo.caption, locale) : undefined}>
              <a href={mediaUrl(photo.mediaKey)}>
                <MediaImage mediaKey={photo.mediaKey} alt={caption || `${title} · ${t(EVENTS, 'photo', locale)} ${index + 1}`} />
              </a>
              {caption && <figcaption>{caption}</figcaption>}
            </figure>
          );
        })}
      </div>
    </section>
  );
}

/**
 * The page of one event. Registration is offered only until the event ends; afterwards the page stays as a record
 * with its photos.
 * 单个活动的页面。报名入口只在活动结束前提供；结束后页面作为记录保留，并展示活动照片。
 */
export function EventDetailView({ ctx, event }: { ctx: PageContext; event: SiteEventDetail }) {
  const { locale } = ctx;
  const title = txt(event.title, locale);
  const location = txt(event.location, locale);
  const category = txt(EVENT_CATEGORY_LABELS[event.category], locale);
  const when = formatTimeRange(event.startsAt, event.endsAt, locale, ctx.currentYear);
  const status = timeStatus(event.startsAt, event.endsAt, ctx.now);
  const registrationUrl = status === 'past' ? null : event.registrationUrl;
  return (
    <article aria-labelledby={TITLE_ID}>
      <header class="page-hero">
        <div class="container">
          <a class="backlink" href={sitePath('/events')}>
            <Icon name="arrow" />
            {t(EVENTS, 'backToEvents', locale)}
          </a>
          {/* The chips take the eyebrow slot above the title. */}
          {/* 标签占用标题上方的眉标位置。 */}
          <div class="eyebrow">
            <span class={`chip chip--${event.category}`}>{category}</span>
            <StatusChip status={status} locale={locale} />
          </div>
          <h1 class="page-hero__title" id={TITLE_ID}>
            <Bi text={event.title} />
          </h1>
          <div class="meta">
            <MetaItem icon="calendar" text={when} />
            {location && <MetaItem icon="pin" text={location} lang={fallbackLang(event.location, locale)} />}
          </div>
          <BiText text={event.summary} class="lead page-hero__lead" />
        </div>
      </header>
      <div class="section">
        <div class="container">
          <div class="detail">
            <div>
              {event.coverKey && <MediaImage class="detail__cover" mediaKey={event.coverKey} alt={title} lang={fallbackLang(event.title, locale)} eager />}
              <BiRichText text={event.body} />
              {event.photos.length > 0 && (
                <>
                  <hr />
                  <Gallery event={event} ctx={ctx} />
                </>
              )}
            </div>
            <aside class="detail__aside" aria-label={t(EVENTS, 'detailsLabel', locale)}>
              <div class="info-list">
                <InfoRow label={t(EVENTS, 'dateAndTime', locale)} value={when} />
                <InfoRow label={t(EVENTS, 'location', locale)} value={location || t(COMMON, 'toBeAnnounced', locale)} lang={fallbackLang(event.location, locale)} />
                <InfoRow label={t(EVENTS, 'category', locale)} value={category} />
              </div>
              {registrationUrl && (
                <a class="btn btn--primary" href={registrationUrl} target="_blank" rel="noopener noreferrer">
                  {t(EVENTS, 'registerNow', locale)}
                  <Icon name="external" />
                </a>
              )}
            </aside>
          </div>
        </div>
      </div>
    </article>
  );
}
