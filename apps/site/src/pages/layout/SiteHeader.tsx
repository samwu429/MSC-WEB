import type { PageContext } from '../context';
import { COMMON, t } from '../i18n/strings';
import { sitePath, siteHref } from '../routing/paths';
import { BookMark, Icon } from '../components/Icon';
import { Bi, BiText } from '../components/common';
import { navItems, type NavItem } from './navigation';

/** A section in the desktop bar, its label stacked over its Chinese. */
/** 桌面导航栏中的一个板块，标签下方叠放中文。 */
function DesktopNavItem({ item }: { item: NavItem }) {
  return (
    <a class="site-nav__link" href={item.href} aria-current={item.current}>
      <span class="site-nav__label">
        <Bi text={item.label} />
      </span>
    </a>
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
                  <a href={item.href} aria-current={item.current}>
                    <Bi text={item.label} />
                  </a>
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
