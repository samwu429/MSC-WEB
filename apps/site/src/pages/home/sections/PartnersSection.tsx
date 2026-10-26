import { PARTNER_KINDS, PARTNER_KIND_LABELS, isSafeHttpUrl, mediaUrl, type Locale, type Partner } from '@msc-web/content';
import type { PageContext } from '../../context';
import { Bi, EmptyState, SectionHeading, fallbackLang, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { HOME } from '../strings';

/**
 * One organization: its logo, or its name set large when there is no logo, with the name beneath. The name under
 * the logo is what screen readers hear, so the logo itself has empty alt text. With a website the whole tile links
 * there in a new tab.
 * 一个组织：其 Logo；没有 Logo 时以大号文字显示名称，下方再附名称。读屏软件读的是 Logo 下方的名称，因此 Logo 本身的替代文字为空。
 * 填写了网站时，整块卡片在新标签页中打开该网站。
 */
function PartnerTile({ partner, locale }: { partner: Partner; locale: Locale }) {
  const name = txt(partner.name, locale);
  const lang = fallbackLang(partner.name, locale);
  const body = (
    <>
      <span class="partner__logo">
        {partner.logoKey ? (
          <img src={mediaUrl(partner.logoKey)} alt="" loading="lazy" decoding="async" />
        ) : (
          <span class="partner__mark" aria-hidden="true" lang={lang}>
            {name}
          </span>
        )}
      </span>
      <span class="partner__name">
        <Bi text={partner.name} />
      </span>
    </>
  );
  return partner.url && isSafeHttpUrl(partner.url) ? (
    <a class="partner" href={partner.url} rel="noopener noreferrer" target="_blank">
      {body}
    </a>
  ) : (
    <div class="partner">{body}</div>
  );
}

/**
 * Sponsors, partners and partner clubs from the site settings, one group per kind in a fixed order, each in the
 * order the backend lists them. Kinds with nobody are left out; until anyone is added the section invites contact.
 * 来自网站设置的赞助商、合作商与联动社团，按固定顺序每类一组，组内按后台列出的顺序排列。没有条目的类别不显示；
 * 在添加任何条目之前，板块会邀请有意者联系我们。
 */
export function PartnersSection({ ctx }: { ctx: PageContext }) {
  const { locale } = ctx;
  const groups = PARTNER_KINDS.map((kind) => ({ kind, items: ctx.settings.partners.items.filter((partner) => partner.kind === kind) })).filter(
    (group) => group.items.length > 0,
  );
  return (
    <section class="section section--alt" aria-labelledby="home-partners">
      <div class="container">
        <SectionHeading id="home-partners" eyebrow={t(HOME, 'partnersEyebrow', locale)} title={HOME.partnersTitle} lead={HOME.partnersLead} />
        {groups.length > 0 ? (
          groups.map((group) => (
            <div class="partner-group">
              <h3 class="partner-group__title">
                <Bi text={PARTNER_KIND_LABELS[group.kind]} />
              </h3>
              <ul class="partner-grid">
                {group.items.map((partner) => (
                  <li>
                    <PartnerTile partner={partner} locale={locale} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <EmptyState title={HOME.partnersEmptyTitle} text={HOME.partnersEmptyText} />
        )}
      </div>
    </section>
  );
}
