import { dateBadge, localeTag, mediaUrl, pickText, type Locale, type LocalizedText, type TimeStatus } from '@msc-web/content';
import { COMMON, t } from '../i18n/strings';
import { Icon, type IconName } from './Icon';
import { RichText } from './RichText';

/**
 * Small building blocks shared by every page: bilingual text, section headings, empty states, chips, date badges,
 * meta lines and images from the media store.
 * 各页面共用的小组件：双语文字、板块标题、空状态、标签、日期徽章、信息行以及来自媒体库的图片。
 */

/**
 * Text a page shows. A plain string is shown as written, in English only (Our People, buttons, short labels); both
 * languages show the English with the Chinese beneath it in small light type.
 * 页面显示的文字。普通字符串按原样只显示英文（"我们的团队"、按钮、简短标签）；两种语言则显示英文，并在其下方以浅色小字附上中文。
 */
export type Copy = string | LocalizedText;

/** The English of a text, or the Chinese with its lang when no English was written, and the Chinese to show beneath. */
/** 文字的英文；未写英文时改用中文并带上 lang；以及要附在下方的中文。 */
function sides(text: LocalizedText): { main: string; mainLang?: string; zh: string } {
  const en = text.en.trim();
  const zh = text.zh.trim();
  if (!en) return { main: zh, mainLang: zh ? 'zh-CN' : undefined, zh: '' };
  return { main: en, zh: zh && zh !== en ? zh : '' };
}

/** A heading or label: the English, then the Chinese on its own line in small light type. */
/** 标题或标签：英文，下面另起一行以浅色小字显示中文。 */
export function Bi({ text }: { text: Copy }) {
  if (typeof text === 'string') return <>{text}</>;
  const { main, mainLang, zh } = sides(text);
  return (
    <>
      {mainLang ? <span lang={mainLang}>{main}</span> : main}
      {zh && (
        <span class="zh" lang="zh-CN">
          {zh}
        </span>
      )}
    </>
  );
}

/** A paragraph: the English, then the same paragraph in Chinese in small light type. */
/** 段落：英文，然后以浅色小字显示同一段的中文。 */
export function BiText({ text, class: className }: { text: Copy; class?: string }) {
  if (typeof text === 'string') return text ? <p class={className}>{text}</p> : null;
  const { main, mainLang, zh } = sides(text);
  if (!main) return null;
  return (
    <>
      <p class={className} lang={mainLang}>
        {main}
      </p>
      {zh && (
        <p class={className ? `${className} zh-text` : 'zh-text'} lang="zh-CN">
          {zh}
        </p>
      )}
    </>
  );
}

/** Editor text with paragraphs and links: the English, then the Chinese in small light type. */
/** 带段落与链接的编辑者文字：英文，然后以浅色小字显示中文。 */
export function BiRichText({ text, class: className = 'prose' }: { text: LocalizedText; class?: string }) {
  const { main, mainLang, zh } = sides(text);
  return (
    <>
      <RichText text={main} class={className} lang={mainLang} />
      {zh && <RichText text={zh} class={`${className} zh-text`} lang="zh-CN" />}
    </>
  );
}

export function SectionHeading(props: { eyebrow?: string; title: Copy; lead?: Copy; link?: { href: string; label: string }; id?: string }) {
  return (
    <div class="section-head">
      <div>
        {props.eyebrow && <div class="eyebrow">{props.eyebrow}</div>}
        <h2 class="section-title" id={props.id}>
          <Bi text={props.title} />
        </h2>
        {props.lead && <BiText text={props.lead} class="section-lead" />}
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

export function PageHero(props: { eyebrow?: string; title: Copy; lead?: Copy; children?: unknown }) {
  return (
    <header class="page-hero">
      <div class="container">
        {props.eyebrow && <div class="eyebrow">{props.eyebrow}</div>}
        <h1 class="page-hero__title">
          <Bi text={props.title} />
        </h1>
        {props.lead && <BiText text={props.lead} class="page-hero__lead" />}
        {props.children}
      </div>
    </header>
  );
}

export function EmptyState(props: { title: Copy; text?: Copy }) {
  return (
    <div class="empty">
      <strong>
        <Bi text={props.title} />
      </strong>
      {props.text && (
        <span>
          <Bi text={props.text} />
        </span>
      )}
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
