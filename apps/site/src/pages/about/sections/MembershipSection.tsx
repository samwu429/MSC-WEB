import type { PageContext } from '../../context';
import { Icon, type IconName } from '../../components/Icon';
import { Bi, BiText, SectionHeading } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { siteHref } from '../../routing/paths';
import { ABOUT } from '../strings';

const FACTS: readonly { icon: IconName; title: keyof typeof ABOUT; text: keyof typeof ABOUT }[] = [
  { icon: 'users', title: 'factOpenTitle', text: 'factOpenText' },
  { icon: 'sparkle', title: 'factFeeTitle', text: 'factFeeText' },
  { icon: 'link', title: 'factNetworkTitle', text: 'factNetworkText' },
  { icon: 'book', title: 'factDepartmentsTitle', text: 'factDepartmentsText' },
];

/** The membership rules of Article 3 in four facts, with the way in. */
/** 以四条要点说明章程第 3 条的成员规则，并给出加入入口。 */
export function MembershipSection({ ctx }: { ctx: PageContext }) {
  const { locale } = ctx;
  return (
    <section class="section section--alt" aria-labelledby="about-membership">
      <div class="container">
        <SectionHeading id="about-membership" eyebrow={t(ABOUT, 'membershipEyebrow', locale)} title={ABOUT.membershipTitle} />
        <div class="grid">
          <div class="pillars">
            {FACTS.map((fact) => (
              <div class="pillar">
                <div class="pillar__icon">
                  <Icon name={fact.icon} />
                </div>
                <h3 class="pillar__title">
                  <Bi text={ABOUT[fact.title]} />
                </h3>
                <BiText text={ABOUT[fact.text]} class="pillar__text" />
              </div>
            ))}
          </div>
          <div class="btn-row">
            <a class="btn btn--primary" href={siteHref(ctx.settings.join.url)}>
              {t(COMMON, 'joinUs', locale)}
            </a>
            <a class="btn btn--ghost" href={ctx.links.memberApp}>
              {t(COMMON, 'memberNetwork', locale)}
            </a>
            <a class="btn btn--ghost" href={ctx.links.android}>
              <Icon name="download" />
              {t(COMMON, 'downloadAndroid', locale)}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
