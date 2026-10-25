import { DEPARTMENTS, DEPARTMENT_LABELS, PRESIDIUM_POSITIONS, PRESIDIUM_POSITION_LABELS, type Locale } from '@msc-web/content';
import type { PageContext } from '../../context';
import { Icon } from '../../components/Icon';
import { PageHero, txt } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { peoplePageLabel } from '../../layout/navigation';
import { PEOPLE_PAGES, PEOPLE_PAGE_PATHS, localePath, type PeoplePageKey } from '../../routing/paths';
import { peoplePageEyebrow, peoplePageLead } from '../layout/PeopleSectionHero';
import { PEOPLE } from '../strings';

/** What each group is made of, shown as chips: the four offices, the five departments, or who advisors are. */
/** 以标签显示每个团体的构成：四个职位、五个部门，或荣誉顾问的来源。 */
function GroupMakeup({ page, locale }: { page: PeoplePageKey; locale: Locale }) {
  if (page === 'advisors') return <p class="muted small">{t(PEOPLE, 'advisorsHubNote', locale)}</p>;
  const labels = page === 'presidium' ? PRESIDIUM_POSITIONS.map((position) => PRESIDIUM_POSITION_LABELS[position]) : DEPARTMENTS.map((department) => DEPARTMENT_LABELS[department]);
  return (
    <div class="card__meta">
      {labels.map((label) => (
        <span class="chip chip--quiet">{txt(label, locale)}</span>
      ))}
    </div>
  );
}

/**
 * /people: the entry to Our People, one card per group. It is where the header link leads, so on a touch screen
 * without hover the three pages are one tap away.
 * /people："我们的团队" 的入口页，每个团体一张卡片。页眉链接指向这里，没有悬停功能的触屏设备因此也只需轻点一次即可进入三个页面。
 */
export function PeopleHubPage({ ctx }: { ctx: PageContext }) {
  const { locale } = ctx;
  return (
    <>
      <PageHero eyebrow={t(PEOPLE, 'heroEyebrow', locale)} title={t(COMMON, 'navPeople', locale)} lead={t(PEOPLE, 'heroLead', locale)} />
      <section class="section" aria-label={t(PEOPLE, 'subnavLabel', locale)}>
        <div class="container">
          <div class="grid grid--3">
            {PEOPLE_PAGES.map((page) => (
              <article class="card card--link">
                <div class="card__body">
                  <div class="eyebrow">{peoplePageEyebrow(page, ctx)}</div>
                  <h2 class="card__title">
                    <a class="card__link" href={localePath(locale, PEOPLE_PAGE_PATHS[page])}>
                      {txt(peoplePageLabel(page), locale)}
                    </a>
                  </h2>
                  <p class="card__text">{peoplePageLead(page, ctx)}</p>
                  <GroupMakeup page={page} locale={locale} />
                  <span class="link-arrow" aria-hidden="true">
                    {t(PEOPLE, 'hubCardLink', locale)}
                    <Icon name="arrow" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
