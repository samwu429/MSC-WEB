/**
 * The public site's single stylesheet. The palette and the open-book motif come from the UTMMSC logo: deep purple
 * pages, gold rules, warm paper. Pages use the class vocabulary below rather than inline styles (the content
 * security policy forbids inline style attributes on public pages).
 * 公开网站唯一的样式表。配色与 "翻开的书" 图案来自 UTMMSC 标志：深紫色书页、金色横线、暖色纸张。
 * 页面使用下面的类名，而不是行内样式（公开页面的内容安全策略禁止行内 style 属性）。
 *
 * Class vocabulary / 类名一览
 *   Shell       .skip-link .announcement .site-header .site-header__inner .brand .brand__mark .brand__text .brand__name .brand__sub .header-actions .lang-switch
 *   Navigation  .site-nav .site-nav__item .site-nav__link .site-nav__link--parent .site-nav__menu .site-nav__panel .site-nav__menu-link .mobile-nav .mobile-nav__panel .mobile-nav__sub
 *   Layout      .container .section .section--alt .section--tight .grid .grid--2 .grid--3 .split
 *   Headings    .section-head .eyebrow .section-title .section-lead .section-link .page-hero .page-hero__title .page-hero__lead
 *               (.meta and .notice inside .page-hero get their own spacing)
 *   Text        .lead .muted .prose .small .sr-only
 *   Buttons     .btn .btn--primary .btn--gold .btn--ghost .btn--light .btn--small .btn-row .link-arrow
 *   Chips       .chip .chip--academic .chip--extracurricular .chip--midterm .chip--final .chip--upcoming .chip--ongoing .chip--past .chip--tba .chip--quiet
 *   Cards       .card .card--link .card__media .card__placeholder .card__placeholder--teal .card__badges .card__body .card__title .card__text .card__meta .card__link
 *   Meta        .meta .meta__item (an Icon followed by text)
 *   Date        .datebox .datebox__month .datebox__day
 *   Hero        .hero .hero__grid .hero__eyebrow .hero__title .hero__subtitle .hero__tagline .hero__intro .hero__actions .hero__media .hero__photo
 *   Stats       .stats .stat .stat__value .stat__label
 *   Pillars     .pillars .pillar .pillar__icon .pillar__title .pillar__text
 *   People      .people-grid .person .person--vacant .person__photo .person__monogram .person__body .person__name .person__title .person__affiliation .person__bio .person__links
 *   Department  .dept .dept__head .dept__name .dept__text .dept__people
 *   Reviews     .course .course__head .course__code .course__title .course__text .course__sessions .session-row .session-row__main .session-row__label .session-row__when .session-row__actions .materials .material
 *   Tabs        .tabs .tab (aria-current="page" marks the active tab)
 *   Detail      .detail .detail__aside .detail__cover .info-list .info-list__row .info-list__label .info-list__value .backlink
 *   Gallery     .gallery .gallery__item
 *   Documents   .doc-group .doc-list .doc-item .doc-item__icon .doc-item__body .doc-item__title .doc-item__meta
 *   Footer      .site-footer .footer-grid .footer-brand .footer-col .footer-qr .footer-bottom
 *   Misc        .notice .notice--integrity .empty .cta-band .pager
 */
export const SITE_CSS = `
:root {
  --purple-950: #1c0a30;
  --purple-900: #2a1044;
  --purple-800: #3c165f;
  --purple-700: #5b2a86;
  --purple-600: #7240a0;
  --purple-200: #d9c8ea;
  --purple-100: #ece3f5;
  --purple-50: #f6f1fa;
  --gold-500: #ffd23f;
  --gold-600: #e8b90f;
  --gold-700: #8a6a00;
  --gold-100: #fff4cc;
  --teal-700: #1d6b63;
  --teal-100: #ddf1ee;
  --paper: #f7f4ee;
  --paper-deep: #efeae0;
  --surface: #ffffff;
  --ink: #2c2140;
  --ink-soft: #4a4155;
  --muted: #6b6570;
  --line: #e4e0d8;
  --line-strong: #d4cdc0;
  --radius: 16px;
  --radius-sm: 10px;
  --shadow-sm: 0 1px 2px rgba(44, 33, 64, 0.06), 0 4px 14px rgba(44, 33, 64, 0.05);
  --shadow-md: 0 18px 40px -18px rgba(44, 33, 64, 0.35);
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Helvetica Neue", Arial, sans-serif;
  --font-serif: Georgia, "Times New Roman", "Songti SC", "Noto Serif SC", "Source Han Serif SC", "PingFang SC", "Microsoft YaHei", serif;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
  --container: 1160px;
  color-scheme: light;
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; scroll-padding-top: 88px; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
html[lang="en-CA"] body { line-height: 1.6; }
img, svg { display: block; max-width: 100%; }
img { height: auto; }
a { color: var(--purple-700); text-decoration-thickness: 1px; text-underline-offset: 3px; }
a:hover { color: var(--purple-800); }
:focus-visible { outline: 3px solid var(--gold-500); outline-offset: 2px; border-radius: 4px; }
h1, h2, h3, h4 { margin: 0; color: var(--purple-900); font-family: var(--font-serif); font-weight: 700; line-height: 1.25; letter-spacing: -0.005em; }
h1 { font-size: clamp(2rem, 4.2vw, 3.1rem); }
h2 { font-size: clamp(1.55rem, 2.8vw, 2.15rem); }
h3 { font-size: 1.2rem; }
p { margin: 0; }
ul, ol { margin: 0; padding: 0; }
hr { border: 0; border-top: 1px solid var(--line); margin: 32px 0; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.skip-link { position: absolute; left: 12px; top: -48px; z-index: 100; padding: 10px 14px; background: var(--purple-800); color: #fff; border-radius: 8px; }
.skip-link:focus { top: 12px; color: #fff; }

.container { width: 100%; max-width: var(--container); margin: 0 auto; padding: 0 20px; }
.section { padding: 76px 0; }
.section--tight { padding: 48px 0; }
.section--alt { background: var(--surface); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.grid { display: grid; gap: 24px; }
.grid--2 { grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); }
.grid--3 { grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); }
.split { display: grid; gap: 40px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 900px) { .split { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); align-items: start; } }

.lead { font-size: 1.125rem; color: var(--ink-soft); }
.muted { color: var(--muted); }
.small { font-size: 0.875rem; }
.prose { color: var(--ink-soft); }
.prose p + p { margin-top: 1em; }
.prose a { word-break: break-word; }

.eyebrow { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 12px; color: var(--purple-700); font-size: 0.8rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.eyebrow::before { content: ""; width: 26px; height: 3px; background: var(--gold-500); border-radius: 2px; }
.section-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px 32px; margin-bottom: 32px; }
.section-head > div { max-width: 680px; }
.section-title { margin: 0; }
.section-lead { margin-top: 10px; color: var(--muted); }
.section-link { font-weight: 600; text-decoration: none; white-space: nowrap; }
.link-arrow { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; text-decoration: none; }
.link-arrow svg { width: 16px; height: 16px; transition: transform 0.15s ease; }
.link-arrow:hover svg { transform: translateX(3px); }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 20px; border: 1px solid transparent; border-radius: 999px; font: inherit; font-weight: 600; font-size: 0.95rem; line-height: 1.2; text-decoration: none; cursor: pointer; transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease; }
.btn svg { width: 18px; height: 18px; }
.btn:active { transform: translateY(1px); }
.btn--primary { background: var(--purple-700); color: #fff; }
.btn--primary:hover { background: var(--purple-800); color: #fff; }
.btn--gold { background: var(--gold-500); color: var(--purple-950); }
.btn--gold:hover { background: var(--gold-600); color: var(--purple-950); }
.btn--ghost { background: transparent; border-color: var(--line-strong); color: var(--purple-800); }
.btn--ghost:hover { border-color: var(--purple-700); color: var(--purple-800); background: var(--purple-50); }
.btn--light { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.35); color: #fff; }
.btn--light:hover { background: rgba(255, 255, 255, 0.16); color: #fff; }
.btn--small { min-height: 36px; padding: 6px 14px; font-size: 0.875rem; }
.btn-row { display: flex; flex-wrap: wrap; gap: 12px; }

.chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: var(--paper-deep); color: var(--ink-soft); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.02em; line-height: 1.5; white-space: nowrap; }
.chip--academic { background: var(--purple-100); color: var(--purple-800); }
.chip--extracurricular { background: var(--teal-100); color: var(--teal-700); }
.chip--midterm { background: var(--gold-100); color: var(--gold-700); }
.chip--final { background: var(--purple-800); color: #fff; }
.chip--upcoming { background: #e3f3e8; color: #1f6b3d; }
.chip--ongoing { background: var(--gold-500); color: var(--purple-950); }
.chip--past { background: var(--paper-deep); color: var(--muted); }
.chip--tba { background: transparent; color: var(--muted); box-shadow: inset 0 0 0 1px var(--line-strong); }
.chip--quiet { background: transparent; color: var(--muted); padding-left: 0; padding-right: 0; }

.card { position: relative; display: flex; flex-direction: column; overflow: hidden; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow-sm); }
.card--link { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
.card--link:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--line-strong); }
.card__media { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: var(--purple-100); }
.card__media img { width: 100%; height: 100%; object-fit: cover; }
.card__placeholder { position: relative; display: grid; place-items: center; width: 100%; height: 100%; background: radial-gradient(120% 120% at 0% 0%, var(--purple-700) 0%, var(--purple-900) 70%); color: rgba(255, 255, 255, 0.92); }
.card__placeholder svg { width: 64px; height: 64px; opacity: 0.9; }
.card__placeholder--teal { background: radial-gradient(120% 120% at 0% 0%, #2c8a7f 0%, #15443f 72%); }
.card__body { display: flex; flex: 1; flex-direction: column; gap: 10px; padding: 20px 22px 22px; }
.card__title { font-size: 1.15rem; line-height: 1.35; }
.card__title a { color: inherit; text-decoration: none; }
.card__link::after { content: ""; position: absolute; inset: 0; z-index: 1; }
.card__text { color: var(--ink-soft); font-size: 0.95rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.card__meta { display: flex; flex-wrap: wrap; gap: 6px 16px; }
.card__badges { position: absolute; top: 14px; left: 14px; z-index: 2; display: flex; gap: 6px; }

.meta { display: flex; flex-wrap: wrap; gap: 6px 18px; }
.meta__item { display: inline-flex; align-items: flex-start; gap: 7px; color: var(--muted); font-size: 0.9rem; line-height: 1.45; }
.meta__item svg { flex: none; width: 16px; height: 16px; margin-top: 2px; color: var(--purple-600); }

.datebox { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-width: 58px; padding: 6px 8px 8px; border-radius: 12px; background: var(--surface); box-shadow: var(--shadow-sm); text-align: center; line-height: 1.05; }
.datebox__month { color: var(--purple-700); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; }
.datebox__day { margin-top: 3px; color: var(--purple-950); font-family: var(--font-serif); font-size: 1.6rem; font-weight: 700; }

.site-header { position: sticky; top: 0; z-index: 50; background: rgba(247, 244, 238, 0.92); backdrop-filter: saturate(1.4) blur(10px); -webkit-backdrop-filter: saturate(1.4) blur(10px); border-bottom: 1px solid var(--line); }
.site-header__inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 70px; }
.brand { display: inline-flex; align-items: center; gap: 12px; color: var(--purple-900); text-decoration: none; }
.brand:hover { color: var(--purple-900); }
.brand__mark { width: 40px; height: 32px; flex: none; }
.brand__text { display: flex; flex-direction: column; line-height: 1.15; }
.brand__name { font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; letter-spacing: 0.02em; }
.brand__sub { color: var(--muted); font-size: 0.75rem; letter-spacing: 0.04em; }
.site-nav { display: none; align-items: center; gap: 4px; }
.site-nav__link { position: relative; padding: 8px 12px; border-radius: 999px; color: var(--ink-soft); font-size: 0.95rem; font-weight: 600; text-decoration: none; }
.site-nav__link:hover { color: var(--purple-800); background: var(--purple-50); }
.site-nav__link[aria-current] { color: var(--purple-800); }
.site-nav__link[aria-current]::after { content: ""; position: absolute; left: 12px; right: 12px; bottom: 2px; height: 3px; border-radius: 2px; background: var(--gold-500); }
.site-nav__item { position: relative; }
.site-nav__link--parent { display: inline-flex; align-items: center; gap: 4px; }
.site-nav__link--parent svg { width: 15px; height: 15px; transition: transform 0.15s ease; }
.site-nav__menu { position: absolute; left: -6px; top: 100%; z-index: 60; min-width: 230px; padding-top: 12px; visibility: hidden; opacity: 0; transform: translateY(6px); transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s; }
.site-nav__item:hover .site-nav__menu, .site-nav__item:focus-within .site-nav__menu { visibility: visible; opacity: 1; transform: none; }
.site-nav__item:hover .site-nav__link--parent svg, .site-nav__item:focus-within .site-nav__link--parent svg { transform: rotate(180deg); }
.site-nav__panel { display: grid; gap: 2px; padding: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 22px 44px -16px rgba(44, 33, 64, 0.32); }
.site-nav__menu-link { display: block; padding: 13px 18px; border-radius: 8px; color: var(--ink); font-size: 1.02rem; font-weight: 600; text-decoration: none; white-space: nowrap; }
.site-nav__menu-link:hover { background: var(--purple-50); color: var(--purple-800); }
.site-nav__menu-link[aria-current="page"] { background: var(--purple-50); color: var(--purple-800); box-shadow: inset 3px 0 0 var(--gold-500); }
.header-actions { display: none; align-items: center; gap: 10px; }
.lang-switch { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; color: var(--ink-soft); font-size: 0.875rem; font-weight: 600; text-decoration: none; }
.lang-switch:hover { background: var(--purple-50); color: var(--purple-800); }
.lang-switch svg { width: 16px; height: 16px; }
.mobile-nav { position: relative; }
.mobile-nav > summary { display: inline-flex; flex: none; align-items: center; white-space: nowrap; gap: 8px; padding: 8px 14px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--purple-800); font-weight: 600; cursor: pointer; list-style: none; }
.mobile-nav > summary::-webkit-details-marker { display: none; }
.mobile-nav > summary svg { width: 18px; height: 18px; }
.mobile-nav__panel { position: absolute; right: 0; top: calc(100% + 10px); width: min(86vw, 320px); padding: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow-md); }
.mobile-nav__panel a { display: block; padding: 12px 14px; border-radius: 10px; color: var(--ink); font-weight: 600; text-decoration: none; }
.mobile-nav__panel a:hover, .mobile-nav__panel a[aria-current] { background: var(--purple-50); color: var(--purple-800); }
.mobile-nav__sub { display: grid; margin: 0 0 4px 14px; padding-left: 10px; border-left: 2px solid var(--line); }
.mobile-nav__sub a { padding: 9px 12px; font-size: 0.95rem; font-weight: 500; }
.mobile-nav__panel hr { margin: 8px 0; }
@media (min-width: 980px) {
  .site-nav, .header-actions { display: flex; }
  .mobile-nav { display: none; }
}

.announcement { background: var(--gold-500); color: var(--purple-950); font-size: 0.9rem; font-weight: 600; }
.announcement .container { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 4px 12px; min-height: 40px; padding-top: 6px; padding-bottom: 6px; text-align: center; }
.announcement a { color: var(--purple-950); }

.hero { position: relative; overflow: hidden; padding: 56px 0 72px; }
.hero::before { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(180deg, transparent 0 46px, rgba(91, 42, 134, 0.045) 46px 47px); pointer-events: none; }
.hero__grid { position: relative; display: grid; gap: 48px; grid-template-columns: minmax(0, 1fr); align-items: center; }
@media (min-width: 960px) { .hero { padding: 80px 0 96px; } .hero__grid { grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); } }
.hero__eyebrow { margin-bottom: 18px; }
.hero__title { font-size: clamp(2.2rem, 6vw, 4.3rem); line-height: 1.08; color: var(--purple-900); }
.hero__subtitle { margin-top: 10px; color: var(--purple-700); font-family: var(--font-serif); font-size: clamp(1.15rem, 2.2vw, 1.5rem); font-style: italic; }
.hero__tagline { margin-top: 24px; padding-left: 16px; border-left: 4px solid var(--gold-500); color: var(--purple-900); font-size: 1.2rem; font-weight: 600; }
.hero__intro { margin-top: 18px; max-width: 620px; color: var(--ink-soft); font-size: 1.05rem; }
.hero__actions { margin-top: 30px; }
.hero__media { position: relative; }
.hero__media::before { content: ""; position: absolute; inset: 22px -18px -18px 22px; border-radius: 22px; background: var(--gold-500); }
.hero__media::after { content: ""; position: absolute; left: -14px; top: -14px; width: 92px; height: 92px; border-radius: 18px; background: var(--purple-800); }
.hero__photo { position: relative; z-index: 1; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 22px; box-shadow: var(--shadow-md); }

.stats { display: grid; gap: 1px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius); background: var(--line); }
.stat { padding: 22px 24px; background: var(--surface); }
.stat__value { color: var(--purple-800); font-family: var(--font-serif); font-size: 2.1rem; font-weight: 700; line-height: 1.1; }
.stat__label { margin-top: 4px; color: var(--muted); font-size: 0.9rem; }

.pillars { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); }
.pillar { padding: 26px 24px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); }
.pillar__icon { display: grid; place-items: center; width: 46px; height: 46px; margin-bottom: 16px; border-radius: 12px; background: var(--purple-50); color: var(--purple-700); }
.pillar__icon svg { width: 24px; height: 24px; }
.pillar__title { font-size: 1.1rem; }
.pillar__text { margin-top: 8px; color: var(--ink-soft); font-size: 0.95rem; }

.page-hero { position: relative; padding: 56px 0 44px; background: linear-gradient(180deg, var(--purple-50) 0%, var(--paper) 100%); border-bottom: 1px solid var(--line); }
.page-hero__title { font-size: clamp(2rem, 4.5vw, 3rem); }
.page-hero__lead { margin-top: 14px; max-width: 720px; color: var(--ink-soft); font-size: 1.1rem; }
.page-hero .tabs { margin-top: 28px; }
.page-hero .meta { margin-top: 16px; }
.page-hero .notice { margin-top: 20px; max-width: 860px; }

.tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.tab { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid var(--line-strong); border-radius: 999px; background: var(--surface); color: var(--ink-soft); font-size: 0.92rem; font-weight: 600; text-decoration: none; }
.tab:hover { border-color: var(--purple-700); color: var(--purple-800); }
.tab[aria-current="page"] { background: var(--purple-800); border-color: var(--purple-800); color: #fff; }

.people-grid { display: grid; gap: 22px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); }
.person { display: flex; flex-direction: column; overflow: hidden; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); }
.person__photo { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; background: var(--purple-100); }
.person__monogram { display: grid; place-items: center; width: 100%; aspect-ratio: 4 / 5; background: linear-gradient(160deg, var(--purple-700), var(--purple-900)); color: var(--gold-500); font-family: var(--font-serif); font-size: 3.4rem; font-weight: 700; letter-spacing: 0.04em; }
.person__body { display: flex; flex: 1; flex-direction: column; gap: 6px; padding: 18px 20px 20px; }
.person__title { color: var(--purple-700); font-size: 0.8rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.person__name { font-size: 1.2rem; }
.person__affiliation { color: var(--muted); font-size: 0.9rem; }
.person__bio { margin-top: 4px; color: var(--ink-soft); font-size: 0.92rem; }
.person__links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; padding-top: 10px; }
.person__links a { display: inline-flex; align-items: center; gap: 6px; font-size: 0.875rem; font-weight: 600; text-decoration: none; }
.person__links svg { width: 16px; height: 16px; }
.person--vacant { border-style: dashed; background: transparent; }
.person--vacant .person__monogram { background: var(--paper-deep); color: var(--line-strong); }
.person--vacant .person__name { color: var(--muted); font-family: var(--font-sans); font-size: 1rem; font-weight: 600; }

.dept { padding: 28px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); }
.dept + .dept { margin-top: 22px; }
.dept__head { display: grid; gap: 8px; margin-bottom: 22px; }
.dept__name { font-size: 1.4rem; }
.dept__text { max-width: 760px; color: var(--ink-soft); }
.dept__people { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); }

.course { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; }
.course__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 16px; padding: 22px 24px 16px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, var(--purple-50), var(--surface)); }
.course__code { color: var(--purple-800); font-family: var(--font-mono); font-size: 1.35rem; font-weight: 800; letter-spacing: 0.02em; text-decoration: none; }
.course__title { color: var(--ink-soft); font-size: 0.98rem; font-weight: 600; }
.course__text { padding: 14px 24px 0; color: var(--muted); font-size: 0.92rem; }
.course__sessions { display: grid; }
.session-row { display: grid; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--line); }
.session-row:first-child { border-top: 0; }
@media (min-width: 640px) { .session-row { grid-template-columns: minmax(0, 1fr) auto; align-items: center; } }
.session-row__main { display: grid; gap: 6px; }
.session-row__label { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-weight: 700; color: var(--purple-900); }
.session-row__when { color: var(--muted); font-size: 0.9rem; }
.session-row__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.materials { display: flex; flex-wrap: wrap; gap: 8px; }
.material { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--purple-800); font-size: 0.85rem; font-weight: 600; text-decoration: none; background: var(--surface); }
.material:hover { border-color: var(--purple-700); background: var(--purple-50); }
.material svg { width: 15px; height: 15px; }

.detail { display: grid; gap: 40px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 960px) { .detail { grid-template-columns: minmax(0, 7fr) minmax(0, 3fr); } }
.detail__cover { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: var(--radius); box-shadow: var(--shadow-md); margin-bottom: 32px; }
.detail__aside { display: grid; gap: 16px; align-content: start; }
@media (min-width: 960px) { .detail__aside { position: sticky; top: 96px; } }
.info-list { display: grid; gap: 14px; padding: 22px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); }
.info-list__row { display: grid; gap: 2px; }
.info-list__label { color: var(--muted); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.info-list__value { color: var(--ink); font-weight: 600; }
.backlink { display: flex; width: fit-content; align-items: center; gap: 6px; margin-bottom: 18px; color: var(--muted); font-size: 0.9rem; font-weight: 600; text-decoration: none; }
.backlink svg { width: 16px; height: 16px; transform: rotate(180deg); }

.gallery { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); }
.gallery__item { margin: 0; overflow: hidden; border-radius: var(--radius-sm); background: var(--paper-deep); }
.gallery__item img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; transition: transform 0.3s ease; }
.gallery__item a:hover img { transform: scale(1.03); }
.gallery__item figcaption { padding: 8px 12px 10px; color: var(--muted); font-size: 0.85rem; }

.doc-group + .doc-group { margin-top: 32px; }
.doc-group h3 { margin-bottom: 14px; }
.doc-list { display: grid; gap: 10px; list-style: none; }
.doc-item { position: relative; display: flex; align-items: center; gap: 16px; padding: 14px 18px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); }
.doc-item:hover { border-color: var(--purple-700); }
.doc-item__icon { display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 10px; background: var(--purple-50); color: var(--purple-700); }
.doc-item__icon svg { width: 20px; height: 20px; }
.doc-item__body { display: grid; gap: 2px; min-width: 0; }
.doc-item__title { color: var(--ink); font-weight: 600; text-decoration: none; }
.doc-item__title::after { content: ""; position: absolute; inset: 0; }
.doc-item__meta { color: var(--muted); font-size: 0.85rem; }

.notice { display: flex; gap: 14px; padding: 18px 20px; border-radius: var(--radius-sm); background: var(--gold-100); color: var(--ink); border: 1px solid #f3dc8a; }
.notice svg { flex: none; width: 22px; height: 22px; color: var(--gold-700); margin-top: 2px; }
.notice--integrity { background: var(--purple-50); border-color: var(--purple-200); }
.notice--integrity svg { color: var(--purple-700); }
.notice strong { color: var(--purple-900); }

.empty { padding: 40px 24px; border: 1px dashed var(--line-strong); border-radius: var(--radius); color: var(--muted); text-align: center; }
.empty strong { display: block; margin-bottom: 6px; color: var(--ink-soft); font-size: 1.05rem; }

.cta-band { position: relative; overflow: hidden; display: grid; gap: 24px; padding: 44px clamp(24px, 5vw, 56px); border-radius: 24px; background: var(--purple-800); color: #efe8f7; }
.cta-band::after { content: ""; position: absolute; right: -60px; bottom: -60px; width: 240px; height: 240px; border-radius: 50%; border: 36px solid rgba(255, 210, 63, 0.18); }
.cta-band h2 { color: #fff; }
.cta-band p { max-width: 640px; color: #dcd0ea; }
@media (min-width: 860px) { .cta-band { grid-template-columns: minmax(0, 1fr) auto; align-items: center; } }

.pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; margin-top: 36px; }

.site-footer { margin-top: 0; padding: 64px 0 36px; background: var(--purple-950); color: #cfc3df; font-size: 0.92rem; }
.site-footer a { color: #efe8f7; text-decoration: none; }
.site-footer a:hover { color: var(--gold-500); }
.footer-grid { display: grid; gap: 36px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 860px) { .footer-grid { grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr)); } }
.footer-brand .brand { color: #fff; }
.footer-brand .brand__sub { color: #b4a6c7; }
.footer-brand p { margin-top: 16px; max-width: 420px; color: #b9abcc; }
.footer-col h2 { margin-bottom: 14px; color: var(--gold-500); font-family: var(--font-sans); font-size: 0.78rem; letter-spacing: 0.14em; text-transform: uppercase; }
.footer-col ul { display: grid; gap: 10px; list-style: none; }
.footer-col li { display: flex; align-items: center; gap: 8px; }
.footer-col svg { width: 16px; height: 16px; flex: none; color: #b4a6c7; }
.footer-qr { width: 112px; margin-top: 12px; border-radius: 10px; background: #fff; padding: 6px; }
.footer-bottom { display: grid; gap: 10px; margin-top: 44px; padding-top: 22px; border-top: 1px solid rgba(255, 255, 255, 0.12); color: #9d8fb2; font-size: 0.82rem; }

@media (max-width: 640px) {
  .people-grid, .dept__people { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .person__body { padding: 14px 14px 16px; }
  .person__name { font-size: 1.05rem; }
  .person__monogram { font-size: 2.4rem; }
  .section { padding: 56px 0; }
  .hero { padding: 36px 0 56px; }
  .hero__media::after { width: 64px; height: 64px; }
  .card__body { padding: 18px; }
  .dept { padding: 20px; }
  .course__head, .session-row { padding-left: 18px; padding-right: 18px; }
  .course__text { padding: 14px 18px 0; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}

@media print {
  .site-header, .site-footer, .announcement, .btn, .mobile-nav { display: none !important; }
  body { background: #fff; }
}
`;
