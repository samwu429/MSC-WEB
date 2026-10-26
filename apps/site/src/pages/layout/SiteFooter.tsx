import type { PageContext } from '../context';
import { COMMON, t } from '../i18n/strings';
import { SECTION_PATHS, sitePath } from '../routing/paths';
import { BookMark, Icon, type IconName } from '../components/Icon';
import { Bi, BiText, MediaImage, MobileOnlyNote } from '../components/common';
import { hasContactDetails } from '../components/contact';

/**
 * The footer carries the statement Article 1.3 of the constitution requires wherever the Group represents itself:
 * UTMMSC is a student group, not an office of the University. It uses no University crest or word mark (Article 1.4).
 * 页脚载有章程第 1.3 条要求在联盟对外展示时必须说明的内容：UTMMSC 是学生社团，而非学校的办公室。页脚不使用任何学校徽章或字标（第 1.4 条）。
 */
export function SiteFooter({ ctx }: { ctx: PageContext }) {
  const { locale, settings } = ctx;
  const contact = settings.contact;
  const socials: { href: string; label: string; icon: IconName }[] = [
    contact.instagramUrl ? { href: contact.instagramUrl, label: 'Instagram', icon: 'instagram' } : null,
    contact.xiaohongshuUrl ? { href: contact.xiaohongshuUrl, label: 'Xiaohongshu (RED)', icon: 'book' } : null,
    contact.linkedinUrl ? { href: contact.linkedinUrl, label: 'LinkedIn', icon: 'linkedin' } : null,
    contact.githubUrl ? { href: contact.githubUrl, label: 'GitHub', icon: 'github' } : null,
  ].filter((item): item is { href: string; label: string; icon: IconName } => item !== null);

  const explore = [
    { href: sitePath(SECTION_PATHS.events), label: t(COMMON, 'navEvents', locale) },
    { href: sitePath(SECTION_PATHS.reviews), label: t(COMMON, 'navReviews', locale) },
    { href: sitePath(SECTION_PATHS.people), label: t(COMMON, 'navPeople', locale) },
    { href: sitePath(SECTION_PATHS.about), label: t(COMMON, 'navAbout', locale) },
  ];

  return (
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="brand" href={sitePath('/')}>
              <BookMark class="brand__mark" />
              <span class="brand__text">
                <span class="brand__name">UTMMSC</span>
                <span class="brand__sub">
                  {COMMON.siteName.en}
                  <span class="brand__zh" lang="zh-CN">
                    {COMMON.siteName.zh}
                  </span>
                </span>
              </span>
            </a>
            <BiText text={settings.hero.tagline} />
          </div>
          <div class="footer-col">
            <h2>
              <Bi text={COMMON.footerExplore} />
            </h2>
            <ul>
              {explore.map((item) => (
                <li>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div class="footer-col">
            <h2>
              <Bi text={COMMON.footerMembers} />
            </h2>
            <ul>
              <li>
                <a href={ctx.links.memberApp}>{t(COMMON, 'memberNetwork', locale)}</a>
              </li>
              <li>
                <a href={ctx.links.android}>{t(COMMON, 'androidApp', locale)}</a>
              </li>
            </ul>
            <MobileOnlyNote />
          </div>
          {hasContactDetails(contact) && (
            <div class="footer-col">
              <h2>
                <Bi text={COMMON.footerContact} />
              </h2>
              <ul>
                {contact.email && (
                  <li>
                    <Icon name="mail" />
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </li>
                )}
                {contact.wechatId && (
                  <li>
                    <Icon name="chat" />
                    <span>
                      {t(COMMON, 'wechat', locale)}: {contact.wechatId}
                    </span>
                  </li>
                )}
                {socials.map((social) => (
                  <li>
                    <Icon name={social.icon} />
                    <a href={social.href} rel="noopener noreferrer" target="_blank">
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
              {contact.wechatQrKey && <MediaImage class="footer-qr" mediaKey={contact.wechatQrKey} alt="WeChat QR code" />}
            </div>
          )}
        </div>
        <div class="footer-bottom">
          <BiText text={COMMON.footerDisclaimer} />
          <div class="footer-bottom__row">
            <p>
              © {ctx.currentYear} UTMMSC · {t(COMMON, 'campus', locale)}
            </p>
            <a class="footer-admin" href="/admin/" rel="nofollow">
              <Icon name="user" />
              {t(COMMON, 'adminSignIn', locale)}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
