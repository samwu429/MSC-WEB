import { PEOPLE_SECTION_LABELS } from '@msc-web/content';
import type { PageContext } from '../../context';
import { SectionHeading, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { PEOPLE_PAGE_PATHS, localePath } from '../../routing/paths';
import { PresidiumCards } from '../../people/PresidiumCards';
import type { PeopleRoster } from '../../people/roster';
import { PEOPLE } from '../../people/strings';
import { HOME } from '../strings';

export function PresidiumPreviewSection({ ctx, presidium }: { ctx: PageContext; presidium: PeopleRoster['presidium'] }) {
  const { locale } = ctx;
  return (
    <section class="section section--alt" aria-labelledby="home-presidium">
      <div class="container">
        <SectionHeading
          id="home-presidium"
          eyebrow={t(HOME, 'presidiumEyebrow', locale)}
          title={txt(PEOPLE_SECTION_LABELS.presidium, locale)}
          lead={t(PEOPLE, 'presidiumLead', locale)}
          link={{ href: localePath(locale, PEOPLE_PAGE_PATHS.presidium), label: t(HOME, 'presidiumLink', locale) }}
        />
        <PresidiumCards presidium={presidium} locale={locale} compact />
      </div>
    </section>
  );
}
