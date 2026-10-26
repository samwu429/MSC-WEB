/**
 * The public site's single stylesheet. The look is an institutional event site: a utility bar over a white header,
 * a full-width photo banner, full-width bands of the logo's deep purple, bold sans-serif headings, and white pages
 * that alternate with a cool light grey carrying a trace of the purple. Gold, the logo's other colour, marks the
 * main actions and accents on purple. Pages use the class vocabulary below rather than inline styles (the content
 * security policy forbids inline style attributes on public pages).
 * 公开网站唯一的样式表。整体风格是机构活动网站：白色页眉上方有一条工具栏、通栏大图横幅、标志深紫色的通栏色带、加粗的无衬线标题，
 * 白色板块与带一点紫调的冷浅灰板块交替。标志的另一种颜色金色用于主要操作和紫色上的点缀。
 * 页面使用下面的类名，而不是行内样式（公开页面的内容安全策略禁止行内 style 属性）。
 *
 * Class vocabulary / 类名一览
 *   Shell       .skip-link .announcement .topbar .topbar__inner .topbar__links .site-header .site-header__inner .brand .brand__mark .brand__text .brand__name .brand__sub .header-actions .lang-switch
 *   Navigation  .site-nav .site-nav__item .site-nav__link .site-nav__link--parent .site-nav__menu .site-nav__panel .site-nav__menu-link .mobile-nav .mobile-nav__panel .mobile-nav__sub
 *   Layout      .container .section .section--alt .section--tight .grid .grid--2 .grid--3 .split
 *   Headings    .section-head .eyebrow .section-title .section-lead .section-link .page-hero .page-hero__title .page-hero__lead
 *               (.meta, .notice, .tabs and .backlink inside the purple .page-hero get their own colours)
 *   Text        .lead .muted .prose .small .sr-only
 *   Buttons     .btn .btn--primary .btn--gold .btn--ghost .btn--light .btn--small .btn-row .link-arrow
 *   Chips       .chip .chip--academic .chip--extracurricular .chip--midterm .chip--final .chip--upcoming .chip--ongoing .chip--past .chip--tba .chip--quiet
 *   Cards       .card .card--link .card__media .card__placeholder .card__placeholder--teal .card__badges .card__body .card__title .card__text .card__meta .card__link
 *   Meta        .meta .meta__item (an Icon followed by text)
 *   Date        .datebox .datebox__month .datebox__day
 *   Hero        .hero .hero__content .hero__eyebrow .hero__title .hero__subtitle .hero__tagline .hero__actions .hero__photo .intro-band .intro-band__inner .intro-band__mark .hero__intro
 *   Stats       .stats__title .stats .stat .stat__icon .stat__value .stat__label
 *   Pillars     .pillars .pillar .pillar__icon .pillar__title .pillar__text
 *   People      .people-grid .person .person--vacant .person__photo .person__monogram .person__body .person__name .person__title .person__affiliation .person__bio .person__links
 *   Department  .dept .dept__head .dept__name .dept__text .dept__people
 *   Reviews     .course .course__head .course__code .course__title .course__text .course__sessions .session-row .session-row__main .session-row__label .session-row__when .session-row__actions .materials .material
 *   Tabs        .tabs .tab (aria-current="page" marks the active tab)
 *   Detail      .detail .detail__aside .detail__cover .info-list .info-list__row .info-list__label .info-list__value .backlink
 *   Gallery     .gallery .gallery__item
 *   Documents   .doc-group .doc-list .doc-item .doc-item__icon .doc-item__body .doc-item__title .doc-item__meta
 *   Footer      .site-footer .footer-grid .footer-brand .footer-col .footer-qr .footer-bottom .footer-bottom__row .footer-admin
 *   Misc        .notice .notice--integrity .empty .cta-band .cta-band__inner .pager
 */
export const SITE_CSS = `
:root {
  --purple-950: #1d0b33;
  --purple-900: #2b1149;
  --purple-800: #3d1866;
  --purple-700: #5b2a86;
  --purple-600: #7444a3;
  --purple-100: #ebe4f4;
  --purple-50: #f5f1fa;
  --gold-500: #ffd23f;
  --gold-600: #f0bf1a;
  --gold-100: #fff6d6;
  --teal-700: #1d6b63;
  --green-700: #22693b;
  --grey: #f4f3f7;
  --white: #ffffff;
  --ink: #1f1a29;
  --ink-soft: #464050;
  --muted: #6c6775;
  --line: #e2e0e8;
  --line-strong: #cbc7d4;
  --font-sans: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
  --container: 1200px;
  color-scheme: light;
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; scroll-padding-top: 88px; }
body {
  margin: 0;
  background: var(--white);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
html[lang="en-CA"] body { line-height: 1.6; }
img, svg { display: block; max-width: 100%; }
img { height: auto; }
a { color: var(--purple-700); text-underline-offset: 3px; }
a:hover { color: var(--purple-900); }
:focus-visible { outline: 3px solid var(--gold-500); outline-offset: 2px; }
h1, h2, h3, h4 { margin: 0; color: var(--purple-900); font-family: var(--font-sans); font-weight: 700; line-height: 1.3; }
h1 { font-size: clamp(2rem, 4vw, 2.8rem); }
h2 { font-size: clamp(1.6rem, 2.8vw, 2.1rem); }
h3 { font-size: 1.15rem; }
p { margin: 0; }
ul, ol { margin: 0; padding: 0; }
hr { border: 0; border-top: 1px solid var(--line); margin: 32px 0; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.skip-link { position: absolute; left: 12px; top: -48px; z-index: 100; padding: 10px 14px; background: var(--purple-900); color: #fff; }
.skip-link:focus { top: 12px; color: #fff; }

.container { width: 100%; max-width: var(--container); margin: 0 auto; padding: 0 24px; }
.section { padding: 72px 0; }
.section--tight { padding: 56px 0; }
.section--alt { background: var(--grey); }
.grid { display: grid; gap: 24px; }
.grid--2 { grid-template-columns: repeat(auto-fill, minmax(min(100%, 440px), 1fr)); }
.grid--3 { grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); }
.split { display: grid; gap: 40px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 900px) { .split { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); align-items: start; } }

.lead { font-size: 1.125rem; color: var(--ink-soft); }
.muted { color: var(--muted); }
.small { font-size: 0.875rem; }
.prose { color: var(--ink-soft); }
.prose p + p { margin-top: 1em; }
.prose a { word-break: break-word; }

.eyebrow { margin-bottom: 8px; color: var(--purple-600); font-size: 0.9rem; font-weight: 700; letter-spacing: 0.02em; }
.section-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 32px; margin-bottom: 36px; }
.section-head > div { max-width: 720px; }
.section-title { margin: 0; }
.section-lead { margin-top: 10px; color: var(--muted); font-size: 1.02rem; }
.section-link { font-weight: 700; white-space: nowrap; }
.link-arrow { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; text-decoration: none; }
.link-arrow:hover { text-decoration: underline; }
.link-arrow svg { width: 16px; height: 16px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 24px; border: 2px solid transparent; border-radius: 999px; font: inherit; font-weight: 700; font-size: 0.95rem; line-height: 1.2; text-decoration: none; cursor: pointer; transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease; }
.btn svg { width: 18px; height: 18px; }
.btn--primary { background: var(--purple-700); color: #fff; }
.btn--primary:hover { background: var(--purple-900); color: #fff; }
.btn--gold { background: var(--gold-500); color: var(--purple-950); }
.btn--gold:hover { background: var(--gold-600); color: var(--purple-950); }
.btn--ghost { background: transparent; border-color: var(--purple-700); color: var(--purple-700); }
.btn--ghost:hover { background: var(--purple-700); color: #fff; }
.btn--light { background: transparent; border-color: #fff; color: #fff; }
.btn--light:hover { background: #fff; color: var(--purple-900); }
.btn--small { min-height: 36px; padding: 6px 18px; font-size: 0.875rem; }
.btn-row { display: flex; flex-wrap: wrap; gap: 12px; }

.chip { display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px; border-radius: 3px; background: var(--grey); color: var(--ink-soft); font-size: 0.75rem; font-weight: 700; line-height: 1.6; white-space: nowrap; }
.chip--academic { background: var(--purple-700); color: #fff; }
.chip--extracurricular { background: var(--teal-700); color: #fff; }
.chip--midterm { background: var(--gold-500); color: var(--purple-950); }
.chip--final { background: var(--purple-900); color: #fff; }
.chip--upcoming { background: #e2f2e7; color: var(--green-700); }
.chip--ongoing { background: var(--gold-500); color: var(--purple-950); }
.chip--past { background: var(--line); color: var(--muted); }
.chip--tba { background: transparent; color: var(--muted); box-shadow: inset 0 0 0 1px var(--line-strong); }
.chip--quiet { background: transparent; color: var(--muted); padding-left: 0; padding-right: 0; }

.card { position: relative; display: flex; flex-direction: column; overflow: hidden; background: var(--white); border: 1px solid var(--line); border-radius: 4px; }
.section--alt .card { border-color: transparent; }
.card--link { transition: border-color 0.15s ease; }
.card--link:hover { border-color: var(--purple-700); }
.card--link:hover .card__title a { color: var(--purple-700); }
.card__media { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: var(--purple-100); }
.card__media img { width: 100%; height: 100%; object-fit: cover; }
.card__placeholder { position: relative; display: grid; place-items: center; width: 100%; height: 100%; background: var(--purple-800); }
.card__placeholder svg { width: 60px; height: 48px; }
.card__placeholder--teal { background: var(--teal-700); }
.card__body { display: flex; flex: 1; flex-direction: column; gap: 10px; padding: 20px 22px 24px; }
.card__title { font-size: 1.15rem; line-height: 1.4; }
.card__title a { color: inherit; text-decoration: none; }
.card__link::after { content: ""; position: absolute; inset: 0; z-index: 1; }
.card__text { color: var(--ink-soft); font-size: 0.95rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.card__meta { display: flex; flex-wrap: wrap; gap: 6px 16px; }
.card__badges { position: absolute; top: 0; left: 0; z-index: 2; display: flex; }
.card__badges .chip { border-radius: 0; padding: 4px 12px; }

.meta { display: flex; flex-wrap: wrap; gap: 6px 18px; }
.meta__item { display: inline-flex; align-items: flex-start; gap: 7px; color: var(--muted); font-size: 0.9rem; line-height: 1.45; }
.meta__item svg { flex: none; width: 16px; height: 16px; margin-top: 2px; color: var(--purple-600); }

.datebox { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-width: 56px; padding: 6px 8px; background: var(--purple-700); color: #fff; text-align: center; line-height: 1.05; }
.datebox__month { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; opacity: 0.85; }
.datebox__day { margin-top: 3px; font-size: 1.5rem; font-weight: 800; }

.topbar { display: none; background: var(--white); border-bottom: 1px solid var(--line); color: var(--muted); font-size: 0.8rem; }
.topbar__inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 34px; }
.topbar__links { display: flex; align-items: center; }
.topbar__links a { display: inline-flex; align-items: center; gap: 5px; padding: 0 12px; color: var(--ink-soft); text-decoration: none; }
.topbar__links a + a { border-left: 1px solid var(--line-strong); }
.topbar__links a:last-child { padding-right: 0; }
.topbar__links a:hover { color: var(--purple-700); text-decoration: underline; }
.lang-switch { font-weight: 700; }
.lang-switch svg { width: 14px; height: 14px; }
.site-header { position: sticky; top: 0; z-index: 50; background: var(--white); border-bottom: 1px solid var(--line); box-shadow: 0 2px 0 rgba(43, 17, 73, 0.04); }
.site-header__inner { display: flex; align-items: center; gap: 40px; min-height: 72px; }
.brand { display: inline-flex; align-items: center; gap: 12px; color: var(--purple-900); text-decoration: none; }
.brand:hover { color: var(--purple-900); }
.brand__mark { width: 42px; height: 33px; flex: none; }
.brand__text { display: flex; flex-direction: column; line-height: 1.15; }
.brand__name { font-size: 1.2rem; font-weight: 800; letter-spacing: 0.02em; }
.brand__sub { color: var(--purple-600); font-size: 0.75rem; font-weight: 600; }
.site-nav { display: none; align-items: stretch; align-self: stretch; gap: 30px; }
.site-nav__link { position: relative; display: inline-flex; align-items: center; height: 100%; color: var(--ink); font-size: 0.98rem; font-weight: 600; text-decoration: none; }
.site-nav__link:hover { color: var(--purple-700); }
.site-nav__link[aria-current] { color: var(--purple-700); }
.site-nav__link[aria-current]::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 3px; background: var(--purple-700); }
.site-nav__item { position: relative; display: flex; }
.site-nav__link--parent { gap: 3px; }
.site-nav__link--parent svg { width: 15px; height: 15px; }
.site-nav__menu { position: absolute; left: -18px; top: 100%; z-index: 60; min-width: 230px; visibility: hidden; opacity: 0; transition: opacity 0.12s ease, visibility 0.12s; }
.site-nav__item:hover .site-nav__menu, .site-nav__item:focus-within .site-nav__menu { visibility: visible; opacity: 1; }
.site-nav__panel { display: grid; padding: 8px 0; background: var(--white); border-top: 3px solid var(--purple-700); box-shadow: 0 12px 28px rgba(43, 17, 73, 0.14); }
.site-nav__menu-link { display: block; padding: 11px 20px; color: var(--ink); font-size: 0.98rem; font-weight: 600; text-decoration: none; white-space: nowrap; }
.site-nav__menu-link:hover { background: var(--grey); color: var(--purple-700); }
.site-nav__menu-link[aria-current="page"] { color: var(--purple-700); background: var(--purple-50); }
.header-actions { display: none; align-items: center; gap: 10px; margin-left: auto; }
.mobile-nav { position: relative; margin-left: auto; }
.mobile-nav > summary { display: inline-flex; flex: none; align-items: center; white-space: nowrap; gap: 8px; padding: 8px 16px; border-radius: 999px; background: var(--purple-700); color: #fff; font-weight: 700; cursor: pointer; list-style: none; }
.mobile-nav > summary::-webkit-details-marker { display: none; }
.mobile-nav > summary svg { width: 18px; height: 18px; }
.mobile-nav__panel { position: absolute; right: 0; top: calc(100% + 12px); width: min(88vw, 330px); padding: 8px 0; background: var(--white); border-top: 3px solid var(--purple-700); box-shadow: 0 16px 36px rgba(43, 17, 73, 0.2); }
.mobile-nav__panel a { display: block; padding: 12px 20px; color: var(--ink); font-weight: 600; text-decoration: none; }
.mobile-nav__panel a:hover, .mobile-nav__panel a[aria-current] { background: var(--grey); color: var(--purple-700); }
.mobile-nav__sub { display: grid; margin: 0 0 4px 20px; border-left: 2px solid var(--line); }
.mobile-nav__sub a { padding: 9px 16px; font-size: 0.95rem; font-weight: 500; }
.mobile-nav__panel hr { margin: 8px 0; }
@media (min-width: 980px) {
  .topbar { display: block; }
  .site-nav, .header-actions { display: flex; }
  .mobile-nav { display: none; }
}

.announcement { background: var(--purple-900); color: #fff; font-size: 0.9rem; }
.announcement .container { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 4px 14px; min-height: 42px; padding-top: 8px; padding-bottom: 8px; text-align: center; }
.announcement a { color: var(--gold-500); }

.hero { position: relative; display: flex; align-items: flex-end; min-height: min(78vh, 620px); overflow: hidden; background: var(--purple-950); color: #fff; }
.hero__photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(29, 11, 51, 0.82) 0%, rgba(29, 11, 51, 0.55) 45%, rgba(29, 11, 51, 0.1) 80%), linear-gradient(0deg, rgba(29, 11, 51, 0.6) 0%, rgba(29, 11, 51, 0) 50%); }
.hero__content { position: relative; z-index: 1; padding-top: 72px; padding-bottom: 64px; }
.hero__eyebrow { color: var(--gold-500); font-size: 0.95rem; }
.hero__title { color: #fff; font-size: clamp(2.6rem, 6.5vw, 4.4rem); font-weight: 800; line-height: 1.1; letter-spacing: 0.02em; }
.hero__subtitle { margin-top: 8px; color: rgba(255, 255, 255, 0.85); font-size: clamp(1.05rem, 2vw, 1.35rem); font-weight: 600; }
.hero__tagline { margin-top: 20px; max-width: 620px; color: #fff; font-size: clamp(1.05rem, 1.8vw, 1.25rem); }
.hero__actions { margin-top: 30px; }

.intro-band { background: var(--purple-900); color: #fff; }
.intro-band__inner { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px 28px; padding-top: 56px; padding-bottom: 56px; }
.intro-band__mark { color: var(--gold-500); font-family: Georgia, serif; font-size: 6rem; font-weight: 700; line-height: 0.8; }
.intro-band .hero__intro { max-width: 860px; color: #fff; font-size: clamp(1.1rem, 2vw, 1.35rem); font-weight: 600; line-height: 1.75; }
.intro-band .hero__intro a { color: var(--gold-500); }

.stats__title { margin-bottom: 36px; color: var(--purple-700); font-size: clamp(1.6rem, 3vw, 2.2rem); text-align: center; }
.stats { display: grid; gap: 32px 24px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.stat { display: flex; align-items: center; justify-content: center; gap: 16px; }
.stat__icon { flex: none; width: 56px; height: 56px; color: var(--purple-700); stroke-width: 1.3; }
.stat__value { color: var(--purple-700); font-size: 2.4rem; font-weight: 800; line-height: 1.05; }
.stat__label { margin-top: 4px; color: var(--ink-soft); font-size: 0.92rem; font-weight: 600; }

.pillars { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
.pillar { padding: 28px 24px; background: var(--grey); border-top: 4px solid var(--purple-700); }
.section--alt .pillar { background: var(--white); }
.pillar__icon { display: block; margin-bottom: 14px; color: var(--purple-700); }
.pillar__icon svg { width: 40px; height: 40px; stroke-width: 1.4; }
.pillar__title { font-size: 1.15rem; }
.pillar__text { margin-top: 8px; color: var(--ink-soft); font-size: 0.95rem; }

.page-hero { position: relative; padding: 56px 0 48px; background: var(--purple-900); color: #fff; }
.page-hero h1, .page-hero h2 { color: #fff; }
.page-hero .eyebrow { color: var(--gold-500); }
.page-hero__title { font-size: clamp(2.1rem, 4.6vw, 3.1rem); font-weight: 800; }
.page-hero__lead { margin-top: 14px; max-width: 760px; color: rgba(255, 255, 255, 0.85); font-size: 1.08rem; }
.page-hero .tabs { margin-top: 32px; margin-bottom: -48px; }
.page-hero .meta { margin-top: 16px; }
.page-hero .meta__item { color: rgba(255, 255, 255, 0.85); }
.page-hero .meta__item svg { color: var(--gold-500); }
.page-hero .notice { margin-top: 24px; max-width: 880px; background: rgba(255, 255, 255, 0.08); border-left-color: var(--gold-500); color: #fff; }
.page-hero .notice strong { color: var(--gold-500); }
.page-hero .notice svg { color: var(--gold-500); }
.page-hero .backlink { color: rgba(255, 255, 255, 0.75); }
.page-hero .backlink:hover { color: #fff; }
.page-hero a:not(.btn):not(.tab):not(.backlink) { color: var(--gold-500); }

.tabs { display: flex; flex-wrap: wrap; gap: 4px; }
.tab { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.85); font-size: 0.95rem; font-weight: 700; text-decoration: none; }
.tab:hover { background: rgba(255, 255, 255, 0.2); color: #fff; }
.tab[aria-current="page"] { background: var(--white); color: var(--purple-900); }

.people-grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
.person { display: flex; flex-direction: column; overflow: hidden; background: var(--white); border: 1px solid var(--line); border-radius: 4px; }
.section--alt .person { border-color: transparent; }
.person__photo { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; background: var(--purple-100); }
.person__monogram { display: grid; place-items: center; width: 100%; aspect-ratio: 4 / 5; background: var(--purple-100); color: var(--purple-700); font-size: 3.2rem; font-weight: 800; letter-spacing: 0.04em; }
.person__body { display: flex; flex: 1; flex-direction: column; gap: 4px; padding: 16px 20px 20px; border-top: 4px solid var(--purple-700); }
.person__title { color: var(--purple-600); font-size: 0.82rem; font-weight: 700; }
.person__name { font-size: 1.2rem; }
.person__affiliation { color: var(--muted); font-size: 0.9rem; }
.person__bio { margin-top: 6px; color: var(--ink-soft); font-size: 0.92rem; }
.person__links { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: auto; padding-top: 12px; }
.person__links a { display: inline-flex; align-items: center; gap: 6px; font-size: 0.875rem; font-weight: 700; text-decoration: none; }
.person__links svg { width: 16px; height: 16px; }
.person--vacant .person__monogram { background: var(--grey); }
.person--vacant .person__body { border-top-color: var(--line-strong); }
.person--vacant .person__name { color: var(--muted); font-size: 1rem; font-weight: 600; }

.dept { padding: 32px; background: var(--grey); }
.dept + .dept { margin-top: 24px; }
.dept__head { display: grid; gap: 8px; margin-bottom: 24px; padding-left: 16px; border-left: 4px solid var(--purple-700); }
.dept__name { font-size: 1.45rem; }
.dept__text { max-width: 760px; color: var(--ink-soft); }
.dept__people { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); }
.dept .person { border-color: transparent; }

.course { display: flex; flex-direction: column; overflow: hidden; background: var(--white); border: 1px solid var(--line); border-radius: 4px; }
.section--alt .course { border-color: transparent; }
.course__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 16px; padding: 18px 24px; background: var(--purple-50); border-bottom: 1px solid var(--line); }
.course__code { color: var(--purple-800); font-family: var(--font-mono); font-size: 1.3rem; font-weight: 800; text-decoration: none; }
.course__code:hover { text-decoration: underline; }
.course__title { color: var(--ink-soft); font-size: 0.95rem; font-weight: 600; }
.course__text { padding: 14px 24px 0; color: var(--muted); font-size: 0.92rem; }
.course__sessions { display: grid; }
.session-row { display: grid; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--line); }
.session-row:first-child { border-top: 0; }
@media (min-width: 640px) { .session-row { grid-template-columns: minmax(0, 1fr) auto; align-items: center; } }
.session-row__main { display: grid; gap: 4px; }
.session-row__label { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-weight: 700; color: var(--purple-900); }
.session-row__when { color: var(--muted); font-size: 0.9rem; }
.session-row__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.materials { display: flex; flex-wrap: wrap; gap: 8px; }
.material { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid var(--line-strong); border-radius: 999px; background: var(--white); color: var(--purple-700); font-size: 0.85rem; font-weight: 700; text-decoration: none; }
.material:hover { border-color: var(--purple-700); background: var(--purple-50); }
.material svg { width: 15px; height: 15px; }

.detail { display: grid; gap: 48px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 960px) { .detail { grid-template-columns: minmax(0, 7fr) minmax(0, 3fr); } }
.detail__cover { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; margin-bottom: 32px; }
.detail__aside { display: grid; gap: 16px; align-content: start; }
@media (min-width: 960px) { .detail__aside { position: sticky; top: 96px; } }
.info-list { display: grid; gap: 14px; padding: 24px; background: var(--grey); border-top: 4px solid var(--purple-700); }
.info-list__row { display: grid; gap: 2px; }
.info-list__label { color: var(--muted); font-size: 0.8rem; font-weight: 700; }
.info-list__value { color: var(--ink); font-weight: 600; }
.backlink { display: flex; width: fit-content; align-items: center; gap: 6px; margin-bottom: 18px; color: var(--muted); font-size: 0.9rem; font-weight: 600; text-decoration: none; }
.backlink:hover { text-decoration: underline; }
.backlink svg { width: 16px; height: 16px; transform: rotate(180deg); }

.gallery { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }
.gallery__item { position: relative; margin: 0; overflow: hidden; background: var(--purple-100); }
.gallery__item img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; transition: transform 0.3s ease; }
.gallery__item a:hover img { transform: scale(1.03); }
.gallery__item figcaption { position: absolute; left: 0; right: 0; bottom: 0; padding: 28px 14px 10px; background: linear-gradient(0deg, rgba(29, 11, 51, 0.75), rgba(29, 11, 51, 0)); color: #fff; font-size: 0.88rem; font-weight: 600; pointer-events: none; }

.doc-group + .doc-group { margin-top: 36px; }
.doc-group h3 { margin-bottom: 14px; }
.doc-list { display: grid; gap: 8px; list-style: none; }
.doc-item { position: relative; display: flex; align-items: center; gap: 16px; padding: 14px 18px; background: var(--white); border: 1px solid var(--line); border-left: 4px solid var(--purple-700); }
.doc-item:hover { background: var(--purple-50); }
.doc-item__icon { display: grid; place-items: center; flex: none; color: var(--purple-700); }
.doc-item__icon svg { width: 24px; height: 24px; }
.doc-item__body { display: grid; gap: 2px; min-width: 0; }
.doc-item__title { color: var(--ink); font-weight: 700; text-decoration: none; }
.doc-item__title::after { content: ""; position: absolute; inset: 0; }
.doc-item__meta { color: var(--muted); font-size: 0.85rem; }

.notice { display: flex; gap: 14px; padding: 18px 20px; background: var(--gold-100); color: var(--ink); border-left: 4px solid var(--gold-500); }
.notice svg { flex: none; width: 22px; height: 22px; color: var(--purple-700); margin-top: 2px; }
.notice--integrity { background: var(--purple-50); border-left-color: var(--purple-700); }
.notice strong { color: var(--purple-900); }

.empty { padding: 40px 24px; background: var(--white); border: 1px dashed var(--line-strong); color: var(--muted); text-align: center; }
.empty strong { display: block; margin-bottom: 6px; color: var(--ink-soft); font-size: 1.05rem; }

.cta-band { background: var(--gold-500); color: var(--purple-950); }
.cta-band__inner { display: grid; gap: 24px; padding-top: 48px; padding-bottom: 48px; }
.cta-band h2 { color: var(--purple-950); }
.cta-band .section-lead { max-width: 680px; color: var(--purple-900); }
.cta-band .btn--ghost { border-color: var(--purple-900); color: var(--purple-900); }
.cta-band .btn--ghost:hover { background: var(--purple-900); color: #fff; }
@media (min-width: 860px) { .cta-band__inner { grid-template-columns: minmax(0, 1fr) auto; align-items: center; } }

.pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; margin-top: 36px; }

.site-footer { padding: 56px 0 28px; background: var(--grey); border-top: 4px solid var(--purple-700); color: var(--ink-soft); font-size: 0.92rem; }
.site-footer a { color: var(--ink); text-decoration: none; }
.site-footer a:hover { color: var(--purple-700); text-decoration: underline; }
.footer-grid { display: grid; gap: 36px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 860px) { .footer-grid { grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr)); } }
.footer-brand .brand { color: var(--purple-900); }
.footer-brand .brand:hover { text-decoration: none; }
.footer-brand p { margin-top: 16px; max-width: 420px; color: var(--muted); }
.footer-col h2 { margin-bottom: 14px; color: var(--purple-700); font-size: 0.95rem; font-weight: 800; }
.footer-col ul { display: grid; gap: 10px; list-style: none; }
.footer-col li { display: flex; align-items: center; gap: 8px; }
.footer-col svg { width: 16px; height: 16px; flex: none; color: var(--purple-600); }
.footer-qr { width: 112px; margin-top: 12px; padding: 6px; background: #fff; }
.footer-bottom { display: grid; gap: 10px; margin-top: 44px; padding-top: 20px; border-top: 1px solid var(--line-strong); color: var(--muted); font-size: 0.82rem; }
.footer-bottom__row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 24px; }
.site-footer .footer-admin { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--ink-soft); font-weight: 700; }
.site-footer .footer-admin:hover { border-color: var(--purple-700); color: var(--purple-700); text-decoration: none; }
.footer-admin svg { width: 14px; height: 14px; }

@media (max-width: 640px) {
  .container { padding: 0 18px; }
  .people-grid, .dept__people { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .person__body { padding: 12px 12px 14px; }
  .person__name { font-size: 1.02rem; }
  .person__monogram { font-size: 2.4rem; }
  .section { padding: 52px 0; }
  .section--tight { padding: 44px 0; }
  .hero { min-height: 540px; }
  .hero::after { background: linear-gradient(0deg, rgba(29, 11, 51, 0.92) 0%, rgba(29, 11, 51, 0.6) 55%, rgba(29, 11, 51, 0.25) 100%); }
  .hero__content { padding-bottom: 44px; }
  .intro-band__inner { grid-template-columns: minmax(0, 1fr); padding-top: 40px; padding-bottom: 44px; }
  .intro-band__mark { font-size: 4rem; height: 2.6rem; }
  .stats { grid-template-columns: minmax(0, 1fr); gap: 20px; }
  .stat { justify-content: flex-start; }
  .card__body { padding: 18px; }
  .dept { padding: 20px 16px; }
  .course__head, .session-row { padding-left: 18px; padding-right: 18px; }
  .course__text { padding: 14px 18px 0; }
  .tab { padding: 10px 14px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}

@media print {
  .topbar, .site-header, .site-footer, .announcement, .btn, .mobile-nav { display: none !important; }
  body { background: #fff; }
}
`;
