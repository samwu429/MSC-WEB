import { isSafeHttpUrl, localeTag, personDisplayTitle, personInitials, type Locale, type Person } from '@msc-web/content';
import { Icon } from '../components/Icon';
import { MediaImage, fallbackLang, txt } from '../components/common';
import { RichText } from '../components/RichText';
import { COMMON, t } from '../i18n/strings';
import { PEOPLE } from './strings';

/**
 * Cards sit directly under a page h1 (level 2), under a section h2 (level 3) or under a department h2 on the
 * Department Leads page (level 3).
 * 卡片直接位于页面 h1 之下（第 2 级）、板块 h2 之下（第 3 级），或位于部长团页面的部门 h2 之下（第 3 级）。
 */
export type CardHeadingLevel = 2 | 3;

function headingTag(level: CardHeadingLevel): 'h2' | 'h3' {
  return level === 2 ? 'h2' : 'h3';
}

/**
 * One person: photo or monogram, office title, name in the visitor's language with the other one beneath, then
 * affiliation, bio and contact links. `compact` leaves out the bio and links for previews such as the home page.
 * 一位成员：照片或姓名首字、职位头衔、访问者语言的姓名（下方附另一种语言），然后是专业或单位、简介与联系链接。
 * `compact` 省略简介与链接，用于首页等预览场合。
 */
export function PersonCard(props: { person: Person; locale: Locale; headingLevel?: CardHeadingLevel; compact?: boolean }) {
  const { person, locale } = props;
  const Heading = headingTag(props.headingLevel ?? 3);
  const otherLocale: Locale = locale === 'zh' ? 'en' : 'zh';
  const name = txt(person.name, locale);
  const nameLang = fallbackLang(person.name, locale);
  const zhName = person.name.zh.trim();
  const enName = person.name.en.trim();
  const secondaryName = zhName && enName && zhName !== enName ? person.name[otherLocale] : '';
  const displayTitle = personDisplayTitle(person);
  const affiliation = txt(person.affiliation, locale);
  const link = person.linkUrl && isSafeHttpUrl(person.linkUrl) ? person.linkUrl : null;
  const showLinks = !props.compact && (person.email || link);

  return (
    <article class="person">
      {person.photoKey ? (
        <MediaImage class="person__photo" mediaKey={person.photoKey} alt={name} lang={nameLang} />
      ) : (
        <div class="person__monogram" aria-hidden="true">
          {personInitials(name)}
        </div>
      )}
      <div class="person__body">
        <p class="person__title" lang={fallbackLang(displayTitle, locale)}>
          {txt(displayTitle, locale)}
        </p>
        <Heading class="person__name" lang={nameLang}>
          {name}
        </Heading>
        {secondaryName && (
          <p class="muted small" lang={localeTag(otherLocale)}>
            {secondaryName}
          </p>
        )}
        {affiliation && (
          <p class="person__affiliation" lang={fallbackLang(person.affiliation, locale)}>
            {affiliation}
          </p>
        )}
        {!props.compact && <RichText text={txt(person.bio, locale)} class="person__bio" lang={fallbackLang(person.bio, locale)} />}
        {showLinks && (
          <div class="person__links">
            {person.email && (
              <a href={`mailto:${person.email}`} aria-label={`${t(COMMON, 'email', locale)}: ${name}`}>
                <Icon name="mail" />
                {t(COMMON, 'email', locale)}
              </a>
            )}
            {link && (
              <a href={link} rel="noopener noreferrer" target="_blank" aria-label={`${t(PEOPLE, 'profileLink', locale)}: ${name}`}>
                <Icon name="external" />
                {t(PEOPLE, 'profileLink', locale)}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * An office nobody holds yet: its title, "to be announced", and optionally what the office does. The heading names
 * the office for screen readers, so a page of vacancies does not read as a list of identical headings; the visible
 * title line above it is hidden from them to avoid reading the office twice.
 * 尚无人担任的职位：职位名称、"待公布"，以及可选的职责说明。标题为读屏软件写明职位，空缺较多的页面因此不会读成一串相同的标题；
 * 上方可见的职位行对读屏软件隐藏，以免职位被读两遍。
 */
export function VacantPersonCard(props: { title: string; duties?: string; locale: Locale; headingLevel?: CardHeadingLevel }) {
  const Heading = headingTag(props.headingLevel ?? 3);
  return (
    <article class="person person--vacant">
      <div class="person__monogram" aria-hidden="true"></div>
      <div class="person__body">
        <p class="person__title" aria-hidden="true">
          {props.title}
        </p>
        <Heading class="person__name">
          <span class="sr-only">{props.locale === 'zh' ? `${props.title}：` : `${props.title}: `}</span>
          {t(COMMON, 'toBeAnnounced', props.locale)}
        </Heading>
        {props.duties && <p class="person__bio">{props.duties}</p>}
      </div>
    </article>
  );
}
