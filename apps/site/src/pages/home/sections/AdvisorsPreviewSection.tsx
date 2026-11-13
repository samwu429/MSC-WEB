import { PEOPLE_SECTION_LABELS, type Person } from '@msc-web/content';
import type { PageContext } from '../../context';
import { SectionHeading, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { PEOPLE_PAGE_PATHS, sitePath } from '../../routing/paths';
import { AdvisorCards } from '../../people/sections/groups';
import { PEOPLE } from '../../people/strings';
import { HOME } from '../strings';

/**
 * The Honorary Advisors on the home page, in the order the backend sets, as the same tiles the Our People pages use;
 * the full list is on /people/advisors. The heading is left-aligned with its link at the side, so the row starts at
 * the left edge under it rather than in the middle. Until any advisor is shown the section says they will be
 * announced.
 * 首页上的荣誉顾问，按后台设定的顺序显示，与 "我们的团队" 页面相同的方块；完整名单在 /people/advisors。标题左对齐、链接在旁边，
 * 因此这一行从标题下方的左边缘开始，而不是居中。在有荣誉顾问显示之前，板块说明名单即将公布。
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
        <AdvisorCards advisors={advisors} locale={locale} headingLevel={3} alignStart />
      </div>
    </section>
  );
}
