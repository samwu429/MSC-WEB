import { isSafeHttpUrl } from '@msc-web/content';
import type { PageContext } from '../../context';
import { MediaImage, SectionHeading } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { ABOUT } from '../strings';

/** "instagram.com/utmmsc" for "https://instagram.com/utmmsc/": the address people recognise, without the scheme. */
/** 将 "https://instagram.com/utmmsc/" 显示为 "instagram.com/utmmsc"：去掉协议、便于辨认的地址。 */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

export function ContactSection({ ctx }: { ctx: PageContext }) {
  const { locale } = ctx;
  const contact = ctx.settings.contact;
  const socials = [
    { label: 'Instagram', url: contact.instagramUrl },
    { label: t(ABOUT, 'xiaohongshu', locale), url: contact.xiaohongshuUrl },
    { label: 'LinkedIn', url: contact.linkedinUrl },
    { label: 'GitHub', url: contact.githubUrl },
  ].filter((social) => social.url && isSafeHttpUrl(social.url));

  return (
    <section class="section" aria-labelledby="about-contact">
      <div class="container split">
        <SectionHeading
          id="about-contact"
          eyebrow={t(ABOUT, 'contactEyebrow', locale)}
          title={ABOUT.contactTitle}
          lead={ABOUT.contactLead}
        />
        <div class="info-list">
          {contact.email && (
            <div class="info-list__row">
              <span class="info-list__label">{t(COMMON, 'email', locale)}</span>
              <div class="info-list__value prose">
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
            </div>
          )}
          {contact.wechatId && (
            <div class="info-list__row">
              <span class="info-list__label">{t(COMMON, 'wechat', locale)}</span>
              <div class="info-list__value">{contact.wechatId}</div>
            </div>
          )}
          {socials.map((social) => (
            <div class="info-list__row">
              <span class="info-list__label">{social.label}</span>
              <div class="info-list__value prose">
                <a href={social.url} rel="noopener noreferrer" target="_blank">
                  {displayUrl(social.url)}
                </a>
              </div>
            </div>
          ))}
          {contact.wechatQrKey && (
            <div class="info-list__row">
              <span class="info-list__label">{t(ABOUT, 'wechatQr', locale)}</span>
              <div class="info-list__value">
                <MediaImage class="footer-qr" mediaKey={contact.wechatQrKey} alt={t(ABOUT, 'wechatQr', locale)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
