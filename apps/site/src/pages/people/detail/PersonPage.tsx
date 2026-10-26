import { isSafeHttpUrl, localeTag, personDisplayTitle, personInitials, type Locale, type Person } from '@msc-web/content';
import type { PageContext } from '../../context';
import { Icon } from '../../components/Icon';
import { MediaImage, fallbackLang, txt } from '../../components/common';
import { RichText } from '../../components/RichText';
import { COMMON, t } from '../../i18n/strings';
import { peoplePageLabel, peoplePageOfSection } from '../../layout/navigation';
import { PEOPLE_PAGE_PATHS, localePath } from '../../routing/paths';
import { secondaryName } from '../PersonCard';
import { PEOPLE } from '../strings';

/**
 * /people/:id: one person with everything the list cards leave out. The banner names the person and their office,
 * with the way back to the Our People page that lists them; below it the photo sits beside the affiliation, the bio
 * and the contact links.
 * /people/:id：一位成员，包含列表卡片省略的全部内容。横幅写明姓名与职位，并提供返回列出该成员的 "我们的团队" 页面的链接；
 * 下方照片旁是专业或单位、简介与联系方式。
 */
export function PersonPage({ ctx, person }: { ctx: PageContext; person: Person }) {
  const { locale } = ctx;
  const other: Locale = locale === 'zh' ? 'en' : 'zh';
  const page = peoplePageOfSection(person.section);
  const name = txt(person.name, locale);
  const nameLang = fallbackLang(person.name, locale);
  const title = personDisplayTitle(person);
  const otherName = secondaryName(person, locale);
  const affiliation = txt(person.affiliation, locale);
  const bio = txt(person.bio, locale);
  const link = person.linkUrl && isSafeHttpUrl(person.linkUrl) ? person.linkUrl : null;
  return (
    <>
      <header class="page-hero">
        <div class="container">
          <a class="backlink" href={localePath(locale, PEOPLE_PAGE_PATHS[page])}>
            <Icon name="arrow" />
            {txt(peoplePageLabel(page), locale)}
          </a>
          <div class="eyebrow" lang={fallbackLang(title, locale)}>
            {txt(title, locale)}
          </div>
          <h1 class="page-hero__title" lang={nameLang}>
            {name}
          </h1>
          {otherName && (
            <p class="page-hero__lead" lang={localeTag(other)}>
              {otherName}
            </p>
          )}
        </div>
      </header>
      <section class="section">
        <div class="container profile">
          {person.photoKey ? (
            <MediaImage class="profile__photo" mediaKey={person.photoKey} alt={name} lang={nameLang} eager />
          ) : (
            <div class="profile__photo person__monogram" aria-hidden="true">
              {personInitials(name)}
            </div>
          )}
          <div class="profile__body">
            {affiliation && (
              <p class="profile__affiliation" lang={fallbackLang(person.affiliation, locale)}>
                {affiliation}
              </p>
            )}
            {bio && <RichText text={bio} class="prose profile__bio" lang={fallbackLang(person.bio, locale)} />}
            {(person.email || link) && (
              <div class="profile__contact">
                <h2 class="profile__contact-title">{t(PEOPLE, 'contactTitle', locale)}</h2>
                <div class="btn-row">
                  {person.email && (
                    <a class="btn btn--ghost btn--small" href={`mailto:${person.email}`}>
                      <Icon name="mail" />
                      {person.email}
                    </a>
                  )}
                  {link && (
                    <a class="btn btn--ghost btn--small" href={link} rel="noopener noreferrer" target="_blank">
                      <Icon name="external" />
                      {t(PEOPLE, 'profileLink', locale)}
                    </a>
                  )}
                </div>
              </div>
            )}
            {!affiliation && !bio && !person.email && !link && <p class="muted">{t(COMMON, 'toBeAnnounced', locale)}</p>}
          </div>
        </div>
      </section>
    </>
  );
}
