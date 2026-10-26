import type { PageContext } from '../../context';
import { fallbackLang, txt } from '../../components/common';
import { RichText } from '../../components/RichText';
import { COMMON, t } from '../../i18n/strings';
import { siteHref } from '../../routing/paths';
import { HOME } from '../strings';

export function JoinBandSection({ ctx }: { ctx: PageContext }) {
  const { locale, settings } = ctx;
  return (
    <section class="cta-band" aria-labelledby="home-join">
      <div class="container cta-band__inner">
        <div>
          <h2 id="home-join">{t(HOME, 'joinTitle', locale)}</h2>
          <RichText text={txt(settings.join.text, locale)} class="section-lead" lang={fallbackLang(settings.join.text, locale)} />
        </div>
        <div class="btn-row">
          <a class="btn btn--primary" href={siteHref(locale, settings.join.url)}>
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
