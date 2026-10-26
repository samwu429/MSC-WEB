import type { PageContext } from '../../context';
import { Bi, BiRichText, MobileOnlyNote } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { HOME } from '../strings';

export function JoinBandSection({ ctx }: { ctx: PageContext }) {
  const { locale, settings } = ctx;
  return (
    <section class="cta-band" aria-labelledby="home-join">
      <div class="container cta-band__inner">
        <div>
          <h2 id="home-join">
            <Bi text={HOME.joinTitle} />
          </h2>
          <BiRichText text={settings.join.text} class="section-lead" />
        </div>
        <div class="cta-band__action">
          <a class="btn btn--primary" href={ctx.links.memberApp}>
            {t(COMMON, 'memberNetwork', locale)}
          </a>
          <MobileOnlyNote />
        </div>
      </div>
    </section>
  );
}
