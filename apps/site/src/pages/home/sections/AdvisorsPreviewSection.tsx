import { PEOPLE_SECTION_LABELS, type Person } from '@msc-web/content';
import type { PageContext } from '../../context';
import { EmptyState, SectionHeading, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { PEOPLE_PAGE_PATHS, localePath } from '../../routing/paths';
import { PersonCard } from '../../people/PersonCard';
import { PEOPLE } from '../../people/strings';
import { HOME } from '../strings';

/**
 * The Honorary Advisors on the home page, in the order the backend sets, as the same cards the Our People pages use;
 * the full list is on /people/advisors. Until any advisor is shown the section says they will be announced.
 * 首页上的荣誉顾问，按后台设定的顺序显示，卡片与 "我们的团队" 页面相同；完整名单在 /people/advisors。
 * 在有荣誉顾问显示之前，板块说明名单即将公布。
 */
export function AdvisorsPreviewSection({ ctx, advisors }: { ctx: PageContext; advisors: Person[] }) {
  const { locale } = ctx;
  return (
    <section class="section" aria-labelledby="home-advisors">
      <div class="container">
        <SectionHeading
          id="home-advisors"
          eyebrow={t(HOME, 'advisorsEyebrow', locale)}
          title={txt(PEOPLE_SECTION_LABELS.advisor, locale)}
          lead={t(PEOPLE, 'advisorsLead', locale)}
          link={{ href: localePath(locale, PEOPLE_PAGE_PATHS.advisors), label: t(HOME, 'advisorsLink', locale) }}
        />
        {advisors.length > 0 ? (
          <div class="people-grid">
            {advisors.map((person) => (
              <PersonCard person={person} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState title={t(PEOPLE, 'advisorsEmptyTitle', locale)} text={t(PEOPLE, 'advisorsEmptyText', locale)} />
        )}
      </div>
    </section>
  );
}
