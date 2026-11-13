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
 *   Headings    .section-head .eyebrow .section-title .section-lead .section-link .section-more (a quiet link under a lead) .page-hero .page-hero__title .page-hero__lead
 *               (.meta, .notice, .tabs and .backlink inside the purple .page-hero get their own colours)
 *   Text        .lead .muted .prose .small .sr-only
 *   Chinese     .zh (a Chinese line under English in a heading or label) .zh-text (a Chinese paragraph under the English one)
 *   Buttons     .btn .btn--primary .btn--gold .btn--ghost .btn--light .btn--small .btn-row .link-arrow
 *   Chips       .chip .chip--academic .chip--interest .chip--extracurricular .chip--midterm .chip--final .chip--upcoming .chip--ongoing .chip--past .chip--tba .chip--quiet
 *   Cards       .card .card--link .card__media .card__placeholder .card__placeholder--teal .card__badges .card__body .card__title .card__text .card__meta .card__link
 *   Meta        .meta .meta__item (an Icon followed by text)
 *   Date        .datebox .datebox__month .datebox__day
 *   Hero        .hero .hero__content .hero__eyebrow .hero__title .hero__subtitle .hero__tagline .hero__actions .hero__photo .intro-band .intro-band__inner .intro-band__mark .hero__intro
 *   Stats       .stats__title .stats .stat .stat__icon .stat__value .stat__label
 *   Pillars     .pillars .pillar .pillar__icon .pillar__title .pillar__text
 *   Partners    .partner-group .partner-group__title .partner-grid .partner .partner__logo .partner__mark .partner__name
 *   People      .people-tier (one group on /people, under a centred title) .people-page (a group's own page, with larger tiles)
 *               .people-grid (a centred row of tiles) .people-grid--advisors (titles read as credentials) .people-grid--start (the row starts at the left)
 *               .person (one tile) .person__photo .person__monogram .person__name .person__link .person__title .person__affiliation
 *               .vacancies .vacancies__office .vacancies__status (one quiet line for each office nobody holds yet)
 *   Profile     .profile .profile__photo .profile__body .profile__affiliation .profile__bio .profile__contact .profile__contact-title
 *               (a missing photo is a .profile__photo.person__monogram)
 *   Department  .dept .dept__head .dept__name .dept__text .dept__people (the About page's outline of Article 4)
 *   Reviews     .course .course__head .course__code .course__title .course__text .course__sessions .session-row .session-row__main .session-row__label .session-row__when .session-row__actions .materials .material
 *   Tabs        .tabs .tab (aria-current="page" marks the active tab)
 *   Detail      .detail .detail__aside .detail__cover .info-list .info-list__row .info-list__label .info-list__value .backlink
 *   Gallery     .gallery .gallery__item
 *   Documents   .doc-group .doc-list .doc-item .doc-item__icon .doc-item__body .doc-item__title .doc-item__meta
 *   Footer      .site-footer .footer-grid .footer-brand .footer-col .footer-qr .footer-bottom .footer-bottom__row .footer-admin
 *   Member net  .mobile-note (beside member-network links) .topbar__note .cta-band__action
 *   Ended       .past-list .past-list__date .past-list__title .past-list__tag .ended-title .ended-lead .ended-list .ended-list__code .ended-list__name
 *   Docs        .doc-link (a small link to a PDF, such as the Code of Behaviour, or to the University's listing of UTMMSC)
 *   Misc        .notice .notice--integrity .notice__links (a row of links under a notice's text) .empty .cta-band .cta-band__inner .pager
 *
 * Our People lists everyone as the same tile, one size per page set by --tile and --gap on .people-grid: 176px on
 * /people and the home page, 160px on tablets (a little less below 753px, so that four always fit on a line), two to
 * a row on phones, and up to 208px on a group's own page, where five fill the 1152px container (on narrower laptops
 * they shrink so that five still fit). From 641px, a group of up to sixteen that does not fit on one line breaks into
 * even rows through :has() counts instead of leaving one tile alone; only thirteen below 929px, where four fit on a
 * line, still ends with one. Those breakpoints leave room for a 17px scrollbar. The base .person__monogram rule also
 * draws the missing photo on a person's own page, so tile-only monogram rules are scoped under .person.
 * "我们的团队" 将每个人显示为相同的方块，每个页面只用一种大小，由 .people-grid 上的 --tile 与 --gap 决定：/people 与首页为 176px，
 * 平板为 160px（窄于 753px 时略小，保证一行总能放下四个），手机上每行两个；团体自己的页面最大为 208px，五个方块正好排满 1152px 的容器
 * （较窄的笔记本上会略微缩小，五个仍排在一行）。从 641px 起，一行放不下、不超过十六人的团体通过 :has() 计数换成整齐的几行，
 * 不会让一个方块单独留在最后一行；只有十三人在 929px 以下（每行放得下四个）时最后一行仍剩一个。这些断点为 17px 的滚动条留出了余地。
 * 基础的 .person__monogram 规则也用于个人页面上缺少照片时的显示，因此只属于方块的姓名首字规则都限定在 .person 之下。
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
  --zh: #9a96a3;
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

.zh { display: block; margin-top: 1px; color: var(--zh); font-size: 0.72rem; font-weight: 400; letter-spacing: 0.02em; line-height: 1.3; }
.zh-text { margin-top: 2px; color: var(--zh); font-size: 0.75rem; font-weight: 400; line-height: 1.5; }
:is(.hero__tagline, .lead, .section-lead, .page-hero__lead, .pillar__text, .card__text, .course__text, .dept__text, .ended-lead, .prose).zh-text { color: var(--zh); font-size: 0.75rem; font-weight: 400; line-height: 1.5; }
p + .zh-text, .prose + .zh-text { margin-top: 2px; }
.section-lead.zh-text, .page-hero__lead.zh-text { margin-top: 2px; }
.stat__label .zh, .footer-col h2 .zh, .partner__name .zh, .doc-item__meta .zh, .course__title .zh, .site-nav__menu-link .zh, .mobile-nav__panel .zh, .pillar__title .zh, .card__title .zh, .dept__name .zh { font-size: 0.625rem; }
.empty .zh { font-size: 0.68rem; }
.page-hero .zh, .page-hero .zh-text, .hero .zh, .hero .zh-text, .intro-band .zh-text, .announcement .zh-text { color: rgba(255, 255, 255, 0.5); }
.cta-band .zh, .cta-band .zh-text { color: rgba(29, 11, 51, 0.5); }
.prose a { word-break: break-word; }

.eyebrow { margin-bottom: 8px; color: var(--purple-600); font-size: 0.9rem; font-weight: 700; letter-spacing: 0.02em; }
.section-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 32px; margin-bottom: 36px; }
.section-head > div { max-width: 720px; }
.section-head:last-child { margin-bottom: 0; }
.section-title { margin: 0; }
.section-lead { margin-top: 10px; color: var(--muted); font-size: 1.02rem; }
.section-link { font-weight: 700; white-space: nowrap; }
.link-arrow { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; text-decoration: none; }
.link-arrow:hover { text-decoration: underline; }
.link-arrow svg { width: 16px; height: 16px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 24px; border: 2px solid transparent; border-radius: 999px; font: inherit; font-weight: 700; font-size: 0.95rem; line-height: 1.2; text-decoration: none; white-space: nowrap; cursor: pointer; transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease; }
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
.chip--interest { background: var(--white); color: var(--purple-800); }
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
.topbar__note { display: inline-flex; align-items: center; gap: 5px; padding-right: 12px; color: var(--muted); }
.topbar__note svg { width: 13px; height: 13px; }
.topbar__zh { margin-left: 6px; color: var(--zh); font-size: 0.9em; }
.site-header { position: sticky; top: 0; z-index: 50; background: var(--white); border-bottom: 1px solid var(--line); box-shadow: 0 2px 0 rgba(43, 17, 73, 0.04); }
.site-header__inner { display: flex; align-items: center; gap: 40px; min-height: 72px; }
.brand { display: inline-flex; align-items: center; gap: 12px; color: var(--purple-900); text-decoration: none; }
.brand:hover { color: var(--purple-900); }
.brand__mark { width: 42px; height: 33px; flex: none; }
.brand__text { display: flex; flex-direction: column; line-height: 1.15; }
.brand__name { font-size: 1.2rem; font-weight: 800; letter-spacing: 0.02em; }
.brand__sub { color: var(--purple-600); font-size: 0.75rem; font-weight: 600; }
.brand__zh { display: block; color: var(--zh); font-size: 0.85em; font-weight: 400; line-height: 1.2; }
.site-nav { display: none; align-items: stretch; align-self: stretch; gap: 26px; }
.site-nav__link { position: relative; display: inline-flex; align-items: center; height: 100%; color: var(--ink); font-size: 0.98rem; font-weight: 600; text-decoration: none; white-space: nowrap; }
.site-nav__link:hover { color: var(--purple-700); }
.site-nav__link[aria-current] { color: var(--purple-700); }
.site-nav__link[aria-current]::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 3px; background: var(--purple-700); }
.site-nav__item { position: relative; display: flex; }
.site-nav__link--parent { gap: 3px; }
.site-nav__link:not(:has(.zh)) { padding-bottom: calc(0.78rem + 1px); }
.site-nav__label { display: inline-flex; flex-direction: column; line-height: 1.15; }
.site-nav__label .zh { font-size: 0.6rem; }
.site-nav__link--parent svg { width: 15px; height: 15px; }
.site-nav__link--parent:has(.zh) svg { margin-bottom: calc(0.78rem + 1px); }
.site-nav__menu { position: absolute; left: -18px; top: 100%; z-index: 60; min-width: 230px; visibility: hidden; opacity: 0; transition: opacity 0.12s ease, visibility 0.12s; }
.site-nav__item:hover .site-nav__menu, .site-nav__item:focus-within .site-nav__menu { visibility: visible; opacity: 1; }
.site-nav__panel { display: grid; padding: 8px 0; background: var(--white); border-top: 3px solid var(--purple-700); box-shadow: 0 12px 28px rgba(43, 17, 73, 0.14); }
.site-nav__menu-link { display: block; padding: 11px 20px; color: var(--ink); font-size: 0.98rem; font-weight: 600; text-decoration: none; white-space: nowrap; }
.site-nav__menu-link:hover { background: var(--grey); color: var(--purple-700); }
.site-nav__menu-link[aria-current] { color: var(--purple-700); background: var(--purple-50); }
.header-actions { display: none; align-items: center; gap: 10px; margin-left: auto; }
.mobile-nav { position: relative; margin-left: auto; }
.mobile-nav > summary { display: inline-flex; flex: none; align-items: center; white-space: nowrap; gap: 8px; padding: 8px 16px; border-radius: 999px; background: var(--purple-700); color: #fff; font-weight: 700; cursor: pointer; list-style: none; }
.mobile-nav > summary::-webkit-details-marker { display: none; }
.mobile-nav > summary svg { width: 18px; height: 18px; }
.mobile-nav__panel { position: absolute; right: 0; top: calc(100% + 12px); width: min(88vw, 330px); max-height: calc(100vh - 84px); max-height: calc(100dvh - 84px); overflow-y: auto; overscroll-behavior: contain; padding: 8px 0; background: var(--white); border-top: 3px solid var(--purple-700); box-shadow: 0 16px 36px rgba(43, 17, 73, 0.2); }
.mobile-nav__panel a { display: block; padding: 12px 20px; color: var(--ink); font-weight: 600; text-decoration: none; }
.mobile-nav__panel a:hover, .mobile-nav__panel a[aria-current] { background: var(--grey); color: var(--purple-700); }
.mobile-nav__sub { display: grid; margin: 0 0 4px 20px; border-left: 2px solid var(--line); }
.mobile-nav__sub a { padding: 9px 16px; font-size: 0.95rem; font-weight: 500; }
.mobile-nav__panel hr { margin: 8px 0; }
@media (min-width: 1080px) {
  .topbar { display: block; }
  .site-nav, .header-actions { display: flex; }
  .mobile-nav { display: none; }
}
@media (min-width: 1080px) and (hover: none) {
  .site-nav, .header-actions { display: none; }
  .mobile-nav { display: block; }
}

.announcement { background: var(--purple-900); color: #fff; font-size: 0.9rem; }
.announcement__text p { margin: 0; }
.announcement .container { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 4px 14px; min-height: 42px; padding-top: 8px; padding-bottom: 8px; text-align: center; }
.announcement a { color: var(--gold-500); }

.hero { position: relative; display: flex; align-items: flex-end; min-height: min(78vh, 620px); overflow: hidden; background: var(--purple-950); color: #fff; }
.hero__photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(29, 11, 51, 0.82) 0%, rgba(29, 11, 51, 0.55) 45%, rgba(29, 11, 51, 0.1) 80%), linear-gradient(0deg, rgba(29, 11, 51, 0.6) 0%, rgba(29, 11, 51, 0) 50%); }
.hero__content { position: relative; z-index: 1; padding-top: 72px; padding-bottom: 64px; }
.hero__eyebrow { color: var(--gold-500); font-size: 0.95rem; }
.hero__title { color: #fff; font-size: clamp(2.6rem, 6.5vw, 4.4rem); font-weight: 800; line-height: 1.1; letter-spacing: 0.02em; }
.hero__subtitle { margin-top: 4px; color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; font-weight: 400; letter-spacing: 0.06em; }
.hero__tagline { margin-top: 20px; max-width: 620px; color: #fff; font-size: clamp(1.05rem, 1.8vw, 1.25rem); }
.hero__actions { margin-top: 30px; }

.intro-band { background: var(--purple-900); color: #fff; }
.intro-band__inner { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px 28px; padding-top: 56px; padding-bottom: 56px; }
.intro-band__mark { color: var(--gold-500); font-family: Georgia, serif; font-size: 6rem; font-weight: 700; line-height: 0.8; }
.intro-band .hero__intro { max-width: 860px; color: #fff; font-size: clamp(1.1rem, 2vw, 1.35rem); font-weight: 600; line-height: 1.75; }
.intro-band .hero__intro a { color: var(--gold-500); }
.intro-band .hero__intro.zh-text { margin-top: 8px; color: rgba(255, 255, 255, 0.5); font-size: 0.78rem; font-weight: 400; line-height: 1.6; }

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
.page-hero .eyebrow .chip + .chip { margin-left: 8px; }
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

.partner-group + .partner-group { margin-top: 40px; }
.partner-group__title { margin-bottom: 16px; padding-left: 12px; border-left: 4px solid var(--purple-700); font-size: 1.1rem; }
.partner-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr)); list-style: none; }
.partner { display: flex; flex-direction: column; height: 100%; background: var(--white); border: 1px solid var(--line); border-radius: 4px; color: var(--ink); text-decoration: none; }
.section--alt .partner { border-color: transparent; }
a.partner:hover { border-color: var(--purple-700); color: var(--purple-700); }
.partner__logo { display: grid; place-items: center; aspect-ratio: 3 / 2; padding: 18px; }
.partner__logo img { width: 100%; height: 100%; object-fit: contain; }
.partner__mark { color: var(--purple-700); font-size: 1.15rem; font-weight: 800; line-height: 1.3; text-align: center; overflow-wrap: anywhere; }
.partner__name { padding: 10px 14px; border-top: 1px solid var(--line); font-size: 0.9rem; font-weight: 600; text-align: center; }

.people-tier .section-title::after { content: ""; display: block; width: 44px; height: 4px; margin-top: 14px; background: var(--gold-500); }
.section-more { margin-top: 12px; }
@media (min-width: 641px) {
  .people-tier .section-head { justify-content: center; text-align: center; }
  .people-tier .section-title::after { margin-left: auto; margin-right: auto; }
}

.person__monogram { display: grid; place-items: center; width: 100%; aspect-ratio: 4 / 5; background: var(--purple-100); color: var(--purple-700); font-size: 3.2rem; font-weight: 800; letter-spacing: 0.04em; }

.people-grid { --tile: 176px; --gap: 18px; display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: center; gap: 40px var(--gap); margin-inline: auto; list-style: none; }
.person { position: relative; display: flex; flex: 0 0 var(--tile); flex-direction: column; min-width: 0; max-width: var(--tile); overflow-wrap: break-word; }
.person :is(.person__photo, .person__monogram) { width: 100%; aspect-ratio: 4 / 5; margin-bottom: 14px; background: var(--purple-100); border-bottom: 4px solid var(--purple-700); transition: border-color 0.15s ease; }
.person .person__photo { object-fit: cover; object-position: 50% 35%; }
.person .person__monogram { font-size: 2.6rem; line-height: 1; text-indent: 0.04em; }
.person:is(:hover, :focus-within) :is(.person__photo, .person__monogram) { border-bottom-color: var(--gold-500); }
.person__name { font-size: 1.05rem; line-height: 1.3; text-wrap: balance; }
.person__link { color: inherit; text-decoration: none; }
.person__link::after { content: ""; position: absolute; inset: 0; }
.person__link:focus-visible { outline: none; }
.person__link:focus-visible::after { outline: 3px solid var(--gold-500); outline-offset: 4px; }
.person:hover .person__link { color: var(--purple-700); text-decoration: underline; }
.person__title { margin-top: 5px; color: var(--purple-700); font-size: 0.85rem; font-weight: 700; line-height: 1.4; text-wrap: balance; }
.people-grid--advisors .person__title { color: var(--muted); font-weight: 400; line-height: 1.45; }
.person__affiliation { display: -webkit-box; margin-top: 3px; overflow: hidden; color: var(--muted); font-size: 0.85rem; line-height: 1.45; text-wrap: balance; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.people-grid--advisors .person__affiliation { margin-top: 6px; }

.vacancies { display: grid; grid-template-columns: auto auto; justify-content: center; row-gap: 6px; list-style: none; color: var(--muted); font-size: 0.9rem; line-height: 1.5; }
.people-grid + .vacancies { margin-top: 36px; }
.vacancies li { display: grid; grid-column: 1 / -1; grid-template-columns: auto auto; grid-template-columns: subgrid; }
.vacancies__office { padding-right: 12px; border-right: 1px solid var(--line-strong); color: var(--ink-soft); font-weight: 700; text-align: right; }
.vacancies__status { padding-left: 12px; white-space: nowrap; }

@media (min-width: 641px) {
  .people-grid:has(> :nth-child(7)) { max-width: calc(4 * var(--tile) + 3 * var(--gap)); }
  .people-grid:has(> :nth-child(9)) { max-width: calc(5 * var(--tile) + 4 * var(--gap)); }
  .people-grid:has(> :nth-child(11)) { max-width: none; }
  .people-grid:has(> :nth-child(13)):not(:has(> :nth-child(14))) { max-width: calc(5 * var(--tile) + 4 * var(--gap)); }
  .people-grid--start { justify-content: flex-start; margin-inline: 0; }
}
@media (min-width: 641px) and (max-width: 1079px) {
  .people-grid { --tile: 160px; --gap: 16px; }
}
@media (min-width: 641px) and (max-width: 752px) {
  .people-grid { --tile: min(160px, calc((100vw - 65px - 3 * var(--gap)) / 4)); }
}
@media (min-width: 641px) and (max-width: 1210px) {
  .people-grid:has(> :nth-child(6)):not(:has(> :nth-child(7))) { max-width: calc(3 * var(--tile) + 2 * var(--gap)); }
  .people-grid:has(> :nth-child(11)):not(:has(> :nth-child(13))),
  .people-grid:has(> :nth-child(16)):not(:has(> :nth-child(17))) { max-width: calc(4 * var(--tile) + 3 * var(--gap)); }
}
@media (min-width: 641px) and (max-width: 928px) {
  .people-grid:has(> :nth-child(5)):not(:has(> :nth-child(6))),
  .people-grid:has(> :nth-child(9)):not(:has(> :nth-child(10))) { max-width: calc(3 * var(--tile) + 2 * var(--gap)); }
}
@media (min-width: 1080px) {
  .people-page .people-grid { --tile: min(208px, calc(20vw - 36px)); --gap: 28px; }
  .people-page .people-grid:has(> :nth-child(6)):not(:has(> :nth-child(7))) { max-width: calc(3 * var(--tile) + 2 * var(--gap)); }
  .people-page .people-grid:has(> :nth-child(11)):not(:has(> :nth-child(13))),
  .people-page .people-grid:has(> :nth-child(16)):not(:has(> :nth-child(17))) { max-width: calc(4 * var(--tile) + 3 * var(--gap)); }
  .people-page .person__name { font-size: 1.12rem; }
}
@media (max-width: 640px) {
  .people-grid { --tile: calc(50% - 8px); justify-content: flex-start; gap: 32px 16px; }
  .people-grid + .vacancies { margin-top: 28px; }
  .vacancies { grid-template-columns: minmax(0, 1fr); justify-content: stretch; row-gap: 12px; }
  .vacancies li { grid-template-columns: minmax(0, 1fr); }
  .vacancies__office { padding-right: 0; border-right: 0; text-align: left; }
  .vacancies__status { padding-left: 0; }
}

.profile { display: grid; gap: 32px 48px; grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (min-width: 760px) { .profile { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); } }
.profile__photo { width: 100%; max-width: 360px; aspect-ratio: 4 / 5; object-fit: cover; background: var(--purple-100); border-bottom: 4px solid var(--purple-700); }
.profile__body { display: grid; gap: 20px; align-content: start; max-width: 720px; }
.profile__affiliation { color: var(--purple-700); font-size: 1.1rem; font-weight: 700; }
.profile__bio { font-size: 1.05rem; line-height: 1.85; }
.profile__contact { padding-top: 20px; border-top: 1px solid var(--line); }
.profile__contact-title { margin-bottom: 12px; font-size: 1rem; }

.dept { padding: 32px; background: var(--grey); }
.dept + .dept { margin-top: 24px; }
.dept__head { display: grid; gap: 8px; margin-bottom: 24px; padding-left: 16px; border-left: 4px solid var(--purple-700); }
.dept__name { font-size: 1.45rem; }
.dept__text { max-width: 760px; color: var(--ink-soft); }
.dept__people { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); }

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
.notice__links { display: flex; flex-wrap: wrap; gap: 0 24px; }
.doc-link { display: inline-flex; align-items: flex-start; gap: 6px; margin-top: 8px; color: var(--purple-700); font-size: 0.85rem; font-weight: 700; text-decoration: none; }
.doc-link:hover { text-decoration: underline; }
.notice .doc-link svg { width: 15px; height: 15px; margin-top: 2px; color: currentColor; }
.doc-link svg { flex: none; width: 15px; height: 15px; margin-top: 2px; }
.page-hero .doc-link { color: var(--gold-500); }
.notice strong { color: var(--purple-900); }

.empty { padding: 40px 24px; background: var(--white); border: 1px dashed var(--line-strong); color: var(--muted); text-align: center; }
.empty strong { display: block; margin-bottom: 6px; color: var(--ink-soft); font-size: 1.05rem; }

.mobile-note { display: flex; align-items: flex-start; gap: 6px; margin-top: 10px; color: var(--muted); font-size: 0.8rem; line-height: 1.4; }
.mobile-note svg { flex: none; width: 14px; height: 14px; margin-top: 1px; }
.mobile-note .zh { margin-top: 1px; font-size: 0.68rem; }
.site-footer .mobile-note { margin-top: 12px; }
.cta-band__action { display: grid; justify-items: start; }
.cta-band .mobile-note { color: var(--purple-900); }
.cta-band { background: var(--gold-500); color: var(--purple-950); }
.cta-band__inner { display: grid; gap: 24px; padding-top: 48px; padding-bottom: 48px; }
.cta-band h2 { color: var(--purple-950); }
.cta-band .section-lead { max-width: 680px; color: var(--purple-900); }
.cta-band .btn--ghost { border-color: var(--purple-900); color: var(--purple-900); }
.cta-band .btn--ghost:hover { background: var(--purple-900); color: #fff; }
@media (min-width: 860px) { .cta-band__inner { grid-template-columns: minmax(0, 1fr) auto; align-items: center; } }

.past-list { display: grid; gap: 2px 32px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 440px), 1fr)); list-style: none; font-size: 0.9rem; }
.past-list li { display: flex; align-items: baseline; gap: 12px; min-width: 0; padding: 5px 0; }
.past-list__date { flex: none; width: 8.5rem; color: var(--muted); font-size: 0.8rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
.past-list__title { flex: 1; min-width: 0; color: var(--ink); font-weight: 600; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.past-list__title:hover { color: var(--purple-700); text-decoration: underline; }
.past-list__title .zh { display: inline; margin-left: 6px; font-size: 0.7rem; }
.past-list__tag { flex: none; color: var(--muted); font-size: 0.75rem; }
.ended-title { color: var(--ink-soft); font-size: 1.05rem; }
.ended-title .zh { display: inline; margin-left: 8px; }
.ended-lead { margin-top: 2px; color: var(--muted); font-size: 0.85rem; }
.ended-list { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 12px; list-style: none; font-size: 0.85rem; }
.ended-list a { display: inline-flex; gap: 6px; align-items: baseline; color: var(--ink-soft); text-decoration: none; }
.ended-list a:hover { color: var(--purple-700); text-decoration: underline; }
.ended-list__code { font-family: var(--font-mono); font-weight: 700; }
.ended-list__name { color: var(--muted); }

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
.site-footer .doc-link { justify-self: start; margin-top: 0; color: var(--purple-700); }
.site-footer .footer-admin { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--ink-soft); font-weight: 700; }
.site-footer .footer-admin:hover { border-color: var(--purple-700); color: var(--purple-700); text-decoration: none; }
.footer-admin svg { width: 14px; height: 14px; }

@media (max-width: 640px) {
  .container { padding: 0 18px; }
  .dept__people, .partner-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
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
  .past-list li { flex-wrap: wrap; column-gap: 12px; row-gap: 0; }
  .past-list__date { width: auto; }
  .past-list__title { flex: 1 0 100%; order: 1; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}

@media print {
  .topbar, .site-header, .site-footer, .announcement, .btn, .mobile-nav { display: none !important; }
  body { background: #fff; }
}
`;
