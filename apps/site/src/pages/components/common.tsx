import { dateBadge, localeTag, mediaUrl, pickText, type Locale, type LocalizedText, type TimeStatus } from '@msc-web/content';
import { COMMON, t } from '../i18n/strings';
import { Icon, type IconName } from './Icon';

/**
 * Small building blocks shared by every page: section headings, empty states, chips, date badges, meta lines and
 * images from the media store.
 * 各页面共用的小组件：板块标题、空状态、标签、日期徽章、信息行以及来自媒体库的图片。
 */

export function SectionHeading(props: { eyebrow?: string; title: string; lead?: string; link?: { href: string; label: string }; id?: string }) {
  return (
    <div class="section-head">
      <div>
        {props.eyebrow && <div class="eyebrow">{props.eyebrow}</div>}
        <h2 class="section-title" id={props.id}>
          {props.title}
        </h2>
        {props.lead && <p class="section-lead">{props.lead}</p>}
      </div>
      {props.link && (
        <a class="section-link link-arrow" href={props.link.href}>
          {props.link.label}
          <Icon name="arrow" />
        </a>
      )}
    </div>
  );
}

export function PageHero(props: { eyebrow?: string; title: string; lead?: string; leadLang?: string; children?: unknown }) {
  return (
    <header class="page-hero">
      <div class="container">
        {props.eyebrow && <div class="eyebrow">{props.eyebrow}</div>}
        <h1 class="page-hero__title">{props.title}</h1>
        {props.lead && (
          <p class="page-hero__lead" lang={props.leadLang}>
            {props.lead}
          </p>
        )}
        {props.children}
      </div>
    </header>
  );
}

export function EmptyState(props: { title: string; text?: string }) {
  return (
    <div class="empty">
      <strong>{props.title}</strong>
      {props.text && <span>{props.text}</span>}
    </div>
  );
}

export function MetaItem(props: { icon: IconName; text: string; lang?: string }) {
  return (
    <span class="meta__item" lang={props.lang}>
      <Icon name={props.icon} />
      <span>{props.text}</span>
    </span>
  );
}

export function DateBox(props: { date: string; locale: Locale }) {
  const badge = dateBadge(props.date, props.locale);
  return (
    <span class="datebox">
      <span class="datebox__month">{badge.month}</span>
      <span class="datebox__day">{badge.day}</span>
    </span>
  );
}

const STATUS_LABEL: Record<TimeStatus, keyof typeof COMMON> = {
  upcoming: 'upcoming',
  ongoing: 'happeningNow',
  past: 'past',
  tba: 'timeTba',
};

export function StatusChip(props: { status: TimeStatus; locale: Locale }) {
  return <span class={`chip chip--${props.status}`}>{t(COMMON, STATUS_LABEL[props.status], props.locale)}</span>;
}

/** An uploaded image, lazily loaded unless it is above the fold. */
/** 上传的图片；除非位于首屏，否则延迟加载。 */
export function MediaImage(props: { mediaKey: string; alt: string; lang?: string; class?: string; eager?: boolean; width?: number; height?: number }) {
  return (
    <img
      class={props.class}
      src={mediaUrl(props.mediaKey)}
      alt={props.alt}
      lang={props.lang}
      loading={props.eager ? 'eager' : 'lazy'}
      decoding="async"
      width={props.width}
      height={props.height}
    />
  );
}

/** Text in the visitor's language, falling back to the other one. */
/** 访问者语言的文字，缺失时改用另一种语言。 */
export function txt(text: LocalizedText, locale: Locale): string {
  return pickText(text, locale);
}

/**
 * The lang attribute for an element showing txt(text, locale): the other language's tag when the text fell back
 * to it, so screen readers switch voice, and undefined otherwise, which leaves the attribute out.
 * 显示 txt(text, locale) 的元素的 lang 属性：文字改用了另一种语言时为该语言的标签，读屏软件因此会切换发音；
 * 否则为 undefined，属性不会输出。
 */
export function fallbackLang(text: LocalizedText, locale: Locale): string | undefined {
  const other: Locale = locale === 'zh' ? 'en' : 'zh';
  return !text[locale].trim() && text[other].trim() ? localeTag(other) : undefined;
}
