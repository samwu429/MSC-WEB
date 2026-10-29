import type { PageContext } from '../context';
import { COMMON, t } from '../i18n/strings';
import { sitePath, siteHref } from '../routing/paths';
import { BookMark, Icon } from '../components/Icon';
import { Bi, BiText } from '../components/common';
import { navItems, type NavItem } from './navigation';

/**
 * A section in the desktop bar, its label stacked over its Chinese. A section with pages of its own opens a
 * dropdown on hover or keyboard focus, in CSS alone because public pages run no script; its own link leads to the
 * section's page that shows everything. A wide touch screen without hover gets the phone menu instead, which lists
 * the pages under their section.
 * 桌面导航栏中的一个板块，标签下方叠放中文。拥有子页面的板块在悬停或键盘聚焦时展开下拉菜单；由于公开页面不运行脚本，菜单完全由 CSS 实现。
 * 板块自身的链接指向显示全部内容的板块页面。没有悬停功能的宽屏触屏设备改用手机菜单，其中在板块下方列出各个子页面。
 */
function DesktopNavItem({ item }: { item: NavItem }) {
  const label = (
    <span class="site-nav__label">
      <Bi text={item.label} />
    </span>
  );
  if (item.children.length === 0) {
    return (
      <a class="site-nav__link" href={item.href} aria-current={item.current}>
        {label}
      </a>
    );
  }
  return (
    <div class="site-nav__item">
      <a class="site-nav__link site-nav__link--parent" href={item.href} aria-current={item.current}>
        {label}
        <Icon name="chevron" />
      </a>
      <div class="site-nav__menu">
        <div class="site-nav__panel">
          {item.children.map((child) => (
            <a class="site-nav__menu-link" href={child.href} aria-current={child.current}>
              <Bi text={child.label} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The sticky header. Desktop shows the navigation inline; narrow screens use a <details> menu with each section's
 * pages listed under it, so the header works without any script. The site has one language, English with Chinese
 * beside it, so there is no language switch.
 * 吸顶页眉。桌面端直接显示导航；窄屏使用 <details> 菜单，并把各板块的子页面列在其下方，因此页眉无需任何脚本即可工作。
 * 网站只有一种语言版本（英文并附中文），因此没有语言切换。
 */
export function SiteHeader({ ctx }: { ctx: PageContext }) {
  const { locale } = ctx;
  const announcement = ctx.settings.announcement;
  const items = navItems(ctx.path);

  return (
    <>
      <a class="skip-link" href="#main">
        {t(COMMON, 'skipToContent', locale)}
      </a>
      {announcement.enabled && (announcement.text.en || announcement.text.zh) && (
        <div class="announcement" role="region" aria-label="Announcement">
          <div class="container">
            <div class="announcement__text">
              <BiText text={announcement.text} />
            </div>
            {announcement.url && (
              <a href={siteHref(announcement.url)} class="link-arrow">
                {t(COMMON, 'learnMore', locale)}
                <Icon name="arrow" />
              </a>
            )}
          </div>
        </div>
      )}
      <div class="topbar">
        <div class="container topbar__inner">
          <span>
            {COMMON.campus.en}
            <span class="topbar__zh" lang="zh-CN">
              {COMMON.campus.zh}
            </span>
          </span>
          <div class="topbar__links">
            <span class="topbar__note">
              <Icon name="phone" />
              {COMMON.memberNetworkMobileOnly.en}
              <span class="topbar__zh" lang="zh-CN">
                {COMMON.memberNetworkMobileOnly.zh}
              </span>
            </span>
            <a href={ctx.links.android}>{t(COMMON, 'androidApp', locale)}</a>
          </div>
        </div>
      </div>
      <header class="site-header">
        <div class="container site-header__inner">
          <a class="brand" href={sitePath('/')} aria-label={`UTMMSC ${t(COMMON, 'siteName', locale)}`}>
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
          <nav class="site-nav" aria-label="Main">
            {items.map((item) => (
              <DesktopNavItem item={item} />
            ))}
          </nav>
          <div class="header-actions">
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
              <nav aria-label="Main">
                {items.map((item) => (
                  <>
                    <a href={item.href} aria-current={item.current}>
                      <Bi text={item.label} />
                    </a>
                    {item.children.length > 0 && (
                      <div class="mobile-nav__sub">
                        {item.children.map((child) => (
                          <a href={child.href} aria-current={child.current}>
                            <Bi text={child.label} />
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ))}
              </nav>
              <hr />
              <a href={ctx.links.memberApp}>{t(COMMON, 'memberNetwork', locale)}</a>
              <a href={ctx.links.android}>{t(COMMON, 'downloadAndroid', locale)}</a>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}
