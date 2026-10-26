import type { PageContext } from '../../context';
import { Bi, BiRichText } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { siteHref } from '../../routing/paths';
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
        <div class="btn-row">
          <a class="btn btn--primary" href={siteHref(settings.join.url)}>
            {t(COMMON, 'joinUs', locale)}
          </a>
          <a class="btn btn--ghost" href={ctx.links.memberApp}>
            {t(COMMON, 'memberNetwork', locale)}
          </a>
        </div>
      </div>
    </section>
  );
}
