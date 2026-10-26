import type { SiteDocument } from '@msc-web/content';
import type { PageContext } from '../context';
import { PageHero } from '../components/common';
import { hasContactDetails } from '../components/contact';
import { COMMON, t } from '../i18n/strings';
import { ContactSection } from './sections/ContactSection';
import { MembershipSection } from './sections/MembershipSection';
import { MissionSection } from './sections/MissionSection';
import { OrganisationSection } from './sections/OrganisationSection';
import { RecordsSection } from './sections/RecordsSection';
import { ABOUT } from './strings';

export function AboutPage({ ctx, documents }: { ctx: PageContext; documents: SiteDocument[] }) {
  const { locale } = ctx;
  return (
    <>
      <PageHero
        eyebrow={t(COMMON, 'siteName', locale)}
        title={ABOUT.heroTitle}
        lead={ctx.settings.hero.intro}
      />
      <MissionSection ctx={ctx} />
      <MembershipSection ctx={ctx} />
      <OrganisationSection ctx={ctx} />
      <RecordsSection ctx={ctx} documents={documents} />
      {hasContactDetails(ctx.settings.contact) && <ContactSection ctx={ctx} />}
    </>
  );
}
