import { PEOPLE_SECTION_LABELS, type Person } from '@msc-web/content';
import type { PageContext } from '../../context';
import { SectionHeading, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { PEOPLE_PAGE_PATHS, sitePath } from '../../routing/paths';
import { AdvisorCards } from '../../people/sections/groups';
import { PEOPLE } from '../../people/strings';
import { HOME } from '../strings';

/**
 * The Honorary Advisors on the home page, in the order the backend sets, as the same centred portraits the Our People
 * pages use; the full list is on /people/advisors. Until any advisor is shown the section says they will be announced.
 * 首页上的荣誉顾问，按后台设定的顺序显示，与 "我们的团队" 页面相同的居中肖像；完整名单在 /people/advisors。
 * 在有荣誉顾问显示之前，板块说明名单即将公布。
 */
export function AdvisorsPreviewSection({ ctx, advisors }: { ctx: PageContext; advisors: Person[] }) {
  const { locale } = ctx;
  return (
    <section class="section section--alt" aria-labelledby="home-advisors">
      <div class="container">
        <SectionHeading
          id="home-advisors"
          eyebrow={t(HOME, 'advisorsEyebrow', locale)}
          title={txt(PEOPLE_SECTION_LABELS.advisor, locale)}
          lead={t(PEOPLE, 'advisorsLead', locale)}
          link={{ href: sitePath(PEOPLE_PAGE_PATHS.advisors), label: t(HOME, 'advisorsLink', locale) }}
        />
        <AdvisorCards advisors={advisors} locale={locale} headingLevel={3} />
      </div>
    </section>
  );
}
