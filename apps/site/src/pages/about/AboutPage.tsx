import type { SiteDocument } from '@msc-web/content';
import type { PageContext } from '../context';
import { Icon } from '../components/Icon';
import { Bi, BiText, PageHero, RecognitionLink } from '../components/common';
import { hasContactDetails } from '../components/contact';
import { COMMON, t } from '../i18n/strings';
import { ContactSection } from './sections/ContactSection';
import { MembershipSection } from './sections/MembershipSection';
import { MissionSection } from './sections/MissionSection';
import { OrganisationSection } from './sections/OrganisationSection';
import { RecordsSection } from './sections/RecordsSection';
import { ABOUT } from './strings';

/**
 * The University's recognition of UTMMSC, in the page hero under the lead, with the link to the University's own
 * listing of the Group.
 * 学校对 UTMMSC 的认可，位于页首导语之下，并附上学校所列联盟页面的链接。
 */
function RecognitionNotice() {
  return (
    <div class="notice" role="note">
      <Icon name="cap" />
      <div>
        <strong>
          <Bi text={ABOUT.recognitionTitle} />
        </strong>
        <BiText text={ABOUT.recognitionText} />
        <RecognitionLink />
      </div>
    </div>
  );
}

export function AboutPage({ ctx, documents }: { ctx: PageContext; documents: SiteDocument[] }) {
  const { locale } = ctx;
  return (
    <>
      <PageHero
        eyebrow={t(COMMON, 'siteName', locale)}
        title={ABOUT.heroTitle}
        lead={ctx.settings.hero.intro}
      >
        <RecognitionNotice />
      </PageHero>
      <MissionSection ctx={ctx} />
      <MembershipSection ctx={ctx} />
      <OrganisationSection ctx={ctx} />
      <RecordsSection ctx={ctx} documents={documents} />
      {hasContactDetails(ctx.settings.contact) && <ContactSection ctx={ctx} />}
    </>
  );
}
