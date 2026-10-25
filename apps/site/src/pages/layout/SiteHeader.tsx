import type { PageContext } from '../context';
import { COMMON, t } from '../i18n/strings';
import { localePath, siteHref } from '../routing/paths';
import { BookMark, Icon } from '../components/Icon';
import { fallbackLang, txt } from '../components/common';
import { navItems, type NavItem } from './navigation';

/**
 * A section in the desktop bar. A section with pages of its own opens a dropdown on hover or keyboard focus,
 * in CSS alone because public pages run no script; its own link still leads to the section's hub page, which
 * is where a touch screen without hover lands.
 * 桌面导航栏中的一个板块。拥有子页面的板块在悬停或键盘聚焦时展开下拉菜单；由于公开页面不运行脚本，菜单完全由 CSS 实现。
 * 板块自身的链接仍指向该板块的入口页，没有悬停功能的触屏设备会进入该页面。
 */
function DesktopNavItem({ item }: { item: NavItem }) {
  if (item.children.length === 0) {
    return (
      <a class="site-nav__link" href={item.href} aria-current={item.current}>
        {item.label}
      </a>
    );
  }
  return (
    <div class="site-nav__item">
      <a class="site-nav__link site-nav__link--parent" href={item.href} aria-current={item.current}>
        {item.label}
        <Icon name="chevron" />
      </a>
      <div class="site-nav__menu">
        <div class="site-nav__panel">
          {item.children.map((child) => (
            <a class="site-nav__menu-link" href={child.href} aria-current={child.current}>
              {child.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The sticky header. Desktop shows the navigation inline; narrow screens use a <details> menu with each section's
 * pages listed under it, so the header works without any script.
 * 吸顶页眉。桌面端直接显示导航；窄屏使用 <details> 菜单，并把各板块的子页面列在其下方，因此页眉无需任何脚本即可工作。
 */
export function SiteHeader({ ctx }: { ctx: PageContext }) {
  const { locale } = ctx;
  const otherLocale = locale === 'zh' ? 'en' : 'zh';
  const switchHref = `${localePath(otherLocale, ctx.path)}${ctx.search}`;
  const switchLabel = locale === 'zh' ? t(COMMON, 'switchToEnglish', locale) : t(COMMON, 'switchToChinese', locale);
  const switchLang = otherLocale === 'zh' ? 'zh-CN' : 'en';
  const announcement = ctx.settings.announcement;
  const items = navItems(locale, ctx.path);
  const navLabel = locale === 'zh' ? '主导航' : 'Main';

  return (
    <>
      <a class="skip-link" href="#main">
        {t(COMMON, 'skipToContent', locale)}
      </a>
      {announcement.enabled && txt(announcement.text, locale) && (
        <div class="announcement" role="region" aria-label={locale === 'zh' ? '公告' : 'Announcement'}>
          <div class="container">
            <span lang={fallbackLang(announcement.text, locale)}>{txt(announcement.text, locale)}</span>
            {announcement.url && (
              <a href={siteHref(locale, announcement.url)} class="link-arrow">
                {t(COMMON, 'learnMore', locale)}
                <Icon name="arrow" />
              </a>
            )}
          </div>
        </div>
      )}
      <header class="site-header">
        <div class="container site-header__inner">
          <a class="brand" href={localePath(locale, '/')} aria-label={`UTMMSC ${t(COMMON, 'siteName', locale)}`}>
            <BookMark class="brand__mark" />
            <span class="brand__text">
              <span class="brand__name">UTMMSC</span>
              <span class="brand__sub">{locale === 'zh' ? '国语学者联盟' : 'Mandarin Scholars Coalition'}</span>
            </span>
          </a>
          <nav class="site-nav" aria-label={navLabel}>
            {items.map((item) => (
              <DesktopNavItem item={item} />
            ))}
          </nav>
          <div class="header-actions">
            <a class="lang-switch" href={switchHref} hreflang={switchLang} lang={switchLang}>
              <Icon name="globe" />
              {switchLabel}
            </a>
            <a class="btn btn--primary btn--small" href={ctx.links.memberApp}>
              {t(COMMON, 'memberNetwork', locale)}
            </a>
          </div>
          <details class="mobile-nav">
            <summary>
              <Icon name="menu" />
              {t(COMMON, 'menu', locale)}
            </summary>
            <div class="mobile-nav__panel">
              <nav aria-label={navLabel}>
                {items.map((item) => (
                  <>
                    <a href={item.href} aria-current={item.current}>
                      {item.label}
                    </a>
                    {item.children.length > 0 && (
                      <div class="mobile-nav__sub">
                        {item.children.map((child) => (
                          <a href={child.href} aria-current={child.current}>
                            {child.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ))}
              </nav>
              <hr />
              <a href={switchHref} hreflang={switchLang} lang={switchLang}>
                {switchLabel}
              </a>
              <a href={ctx.links.memberApp}>{t(COMMON, 'memberNetwork', locale)}</a>
              <a href={ctx.links.android}>{t(COMMON, 'downloadAndroid', locale)}</a>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}
