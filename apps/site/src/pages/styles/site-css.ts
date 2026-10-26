/**
 * The public site's single stylesheet. The look is a printed bulletin: plain white paper, near-black ink, hairline
 * and heavy rules to divide the page, square corners, and the logo's purple kept for links, buttons and one band of
 * colour. Gold appears only as a highlighter stroke and in the logo itself. Pages use the class vocabulary below
 * rather than inline styles (the content security policy forbids inline style attributes on public pages).
 * 公开网站唯一的样式表。整体风格像一份印刷的简报：纯白纸面、近黑色文字、以细线与粗线分隔版面、直角，标志中的紫色只用于链接、
 * 按钮和一处色块。金色只作为荧光笔划线出现，以及在标志本身中。
 * 页面使用下面的类名，而不是行内样式（公开页面的内容安全策略禁止行内 style 属性）。
 *
 * Class vocabulary / 类名一览
 *   Shell       .skip-link .announcement .site-header .site-header__inner .brand .brand__mark .brand__text .brand__name .brand__sub .header-actions .lang-switch
 *   Navigation  .site-nav .site-nav__item .site-nav__link .site-nav__link--parent .site-nav__menu .site-nav__panel .site-nav__menu-link .mobile-nav .mobile-nav__panel .mobile-nav__sub
 *   Layout      .container .section .section--alt .section--tight .grid .grid--2 .grid--3 .split
 *   Headings    .section-head .eyebrow .section-title .section-lead .section-link .page-hero .page-hero__title .page-hero__lead
 *               (.meta and .notice inside .page-hero get their own spacing; section-head eyebrows are numbered 01, 02 … per page)
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
  --paper: #ffffff;
  --ink: #161616;
  --ink-soft: #3a3a3a;
  --muted: #6f6f6f;
  --line: #e4e4e4;
  --rule: #161616;
  --wash: #f5f5f3;
  --purple: #4f2380;
  --purple-deep: #3a1663;
  --purple-wash: #f4f0f8;
  --teal: #1d5f58;
  --green: #2a6a3f;
  --gold: #ffd23f;
  --highlight: #ffe68a;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Helvetica Neue", Arial, sans-serif;
  --font-serif: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Noto Serif SC", "Songti SC", "Source Han Serif SC", "STSong", "SimSun", serif;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
  --container: 1120px;
  color-scheme: light;
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; scroll-padding-top: 84px; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
html[lang="en-CA"] body { line-height: 1.6; }
img, svg { display: block; max-width: 100%; }
img { height: auto; }
a { color: var(--purple); text-decoration-thickness: 1px; text-underline-offset: 3px; }
a:hover { color: var(--purple-deep); text-decoration-thickness: 2px; }
:focus-visible { outline: 2px solid var(--purple); outline-offset: 3px; }
h1, h2, h3, h4 { margin: 0; color: var(--ink); font-family: var(--font-serif); font-weight: 700; line-height: 1.2; }
h1 { font-size: clamp(2rem, 4.2vw, 3rem); }
h2 { font-size: clamp(1.5rem, 2.6vw, 2rem); }
h3 { font-size: 1.18rem; }
p { margin: 0; }
ul, ol { margin: 0; padding: 0; }
hr { border: 0; border-top: 1px solid var(--line); margin: 32px 0; }
main { counter-reset: section; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.skip-link { position: absolute; left: 12px; top: -48px; z-index: 100; padding: 10px 14px; background: var(--ink); color: #fff; }
.skip-link:focus { top: 12px; color: #fff; }

.container { width: 100%; max-width: var(--container); margin: 0 auto; padding: 0 24px; }
.section { padding: 72px 0; }
.section--tight { padding: 40px 0; }
.section--alt { background: var(--paper); }
.grid { display: grid; gap: 40px 32px; }
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

.eyebrow { display: inline-flex; align-items: baseline; gap: 12px; margin-bottom: 14px; color: var(--muted); font-size: 0.875rem; font-weight: 600; letter-spacing: 0.03em; }
.section-head .eyebrow::before { counter-increment: section; content: counter(section, decimal-leading-zero); color: var(--purple); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; }
.section-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 32px; margin-bottom: 40px; padding-top: 16px; border-top: 2px solid var(--rule); }
.section-head > div { max-width: 680px; }
.section-title { margin: 0; }
.section-lead { margin-top: 10px; color: var(--muted); }
.section-link { font-weight: 600; white-space: nowrap; }
.link-arrow { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; text-decoration: none; }
.link-arrow:hover { text-decoration: underline; }
.link-arrow svg { width: 15px; height: 15px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 20px; border: 1px solid transparent; border-radius: 2px; font: inherit; font-weight: 600; font-size: 0.95rem; line-height: 1.2; text-decoration: none; cursor: pointer; transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease; }
.btn:hover { text-decoration: none; }
.btn svg { width: 17px; height: 17px; }
.btn--primary { background: var(--purple); color: #fff; }
.btn--primary:hover { background: var(--purple-deep); color: #fff; }
.btn--gold { background: var(--ink); color: #fff; }
.btn--gold:hover { background: #000; color: #fff; }
.btn--ghost { background: transparent; border-color: var(--ink); color: var(--ink); }
.btn--ghost:hover { background: var(--ink); color: #fff; }
.btn--light { background: transparent; border-color: rgba(255, 255, 255, 0.7); color: #fff; }
.btn--light:hover { background: #fff; color: var(--purple-deep); }
.btn--small { min-height: 36px; padding: 6px 14px; font-size: 0.875rem; }
.btn-row { display: flex; flex-wrap: wrap; gap: 12px; }

.chip { display: inline-flex; align-items: center; gap: 6px; padding: 1px 7px; border: 1px solid var(--line); border-radius: 2px; background: #fff; color: var(--ink-soft); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em; line-height: 1.6; white-space: nowrap; }
.chip--academic { border-color: var(--purple); color: var(--purple); }
.chip--extracurricular { border-color: var(--teal); color: var(--teal); }
.chip--midterm { border-color: var(--ink); color: var(--ink); }
.chip--final { border-color: var(--ink); background: var(--ink); color: #fff; }
.chip--upcoming { border-color: var(--green); color: var(--green); }
.chip--ongoing { border-color: var(--ink); background: var(--highlight); color: var(--ink); }
.chip--past { color: var(--muted); }
.chip--tba { border-style: dashed; color: var(--muted); }
.chip--quiet { border-color: transparent; background: transparent; color: var(--muted); padding-left: 0; padding-right: 0; }

.card { position: relative; display: flex; flex-direction: column; background: transparent; }
.card:not(:has(.card__media)) { padding-top: 20px; border-top: 1px solid var(--rule); }
.card__media { position: relative; aspect-ratio: 3 / 2; overflow: hidden; background: var(--wash); }
.card__media img { width: 100%; height: 100%; object-fit: cover; }
.card__placeholder { position: relative; display: grid; place-items: center; width: 100%; height: 100%; background: var(--purple); }
.card__placeholder svg { width: 56px; height: 44px; }
.card__placeholder--teal { background: var(--teal); }
.card__body { display: flex; flex: 1; flex-direction: column; gap: 8px; padding: 16px 0 0; }
.card__title { font-size: 1.2rem; line-height: 1.35; }
.card__title a { color: inherit; text-decoration: none; }
.card--link:hover .card__title a { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }
.card__link::after { content: ""; position: absolute; inset: 0; z-index: 1; }
.card__text { color: var(--ink-soft); font-size: 0.95rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.card__meta { display: flex; flex-wrap: wrap; gap: 6px 16px; }
.card__badges { position: absolute; top: 12px; left: 12px; z-index: 2; display: flex; gap: 6px; }
.card__badges .chip { border-color: #fff; }
.card .pillar__icon { margin-bottom: 4px; }

.meta { display: flex; flex-wrap: wrap; gap: 4px 18px; }
.meta__item { display: inline-flex; align-items: flex-start; gap: 7px; color: var(--muted); font-size: 0.9rem; line-height: 1.45; }
.meta__item svg { flex: none; width: 15px; height: 15px; margin-top: 2px; color: var(--muted); }

.datebox { display: inline-flex; align-items: baseline; gap: 6px; line-height: 1; }
.datebox__month { color: var(--muted); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em; }
.datebox__day { order: -1; color: var(--ink); font-family: var(--font-serif); font-size: 1.7rem; font-weight: 700; }

.site-header { position: sticky; top: 0; z-index: 50; background: var(--paper); border-bottom: 1px solid var(--line); }
.site-header__inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 68px; }
.brand { display: inline-flex; align-items: center; gap: 12px; color: var(--ink); text-decoration: none; }
.brand:hover { color: var(--ink); }
.brand__mark { width: 36px; height: 29px; flex: none; }
.brand__text { display: flex; flex-direction: column; line-height: 1.15; }
.brand__name { font-family: var(--font-serif); font-size: 1.12rem; font-weight: 700; letter-spacing: 0.03em; }
.brand__sub { color: var(--muted); font-size: 0.75rem; letter-spacing: 0.04em; }
.site-nav { display: none; align-items: stretch; align-self: stretch; gap: 26px; }
.site-nav__link { position: relative; display: inline-flex; align-items: center; height: 100%; color: var(--ink-soft); font-size: 0.95rem; font-weight: 500; text-decoration: none; }
.site-nav__link:hover { color: var(--ink); text-decoration: none; }
.site-nav__link[aria-current] { color: var(--ink); font-weight: 600; }
.site-nav__link[aria-current]::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--ink); }
.site-nav__item { position: relative; display: flex; }
.site-nav__link--parent { gap: 3px; }
.site-nav__link--parent svg { width: 14px; height: 14px; }
.site-nav__link--parent[aria-current]::after { right: 17px; }
.site-nav__menu { position: absolute; left: -16px; top: 100%; z-index: 60; min-width: 220px; visibility: hidden; opacity: 0; transition: opacity 0.1s ease, visibility 0.1s; }
.site-nav__item:hover .site-nav__menu, .site-nav__item:focus-within .site-nav__menu { visibility: visible; opacity: 1; }
.site-nav__panel { display: grid; padding: 6px 0; background: var(--paper); border: 1px solid var(--rule); box-shadow: 4px 4px 0 rgba(22, 22, 22, 0.08); }
.site-nav__menu-link { display: block; padding: 11px 16px; color: var(--ink); font-size: 0.98rem; font-weight: 500; text-decoration: none; white-space: nowrap; }
.site-nav__menu-link:hover { background: var(--wash); color: var(--ink); text-decoration: none; }
.site-nav__menu-link[aria-current="page"] { font-weight: 700; box-shadow: inset 3px 0 0 var(--ink); }
.header-actions { display: none; align-items: center; gap: 18px; }
.lang-switch { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-soft); font-size: 0.875rem; font-weight: 500; text-decoration: none; }
.lang-switch:hover { color: var(--ink); text-decoration: underline; }
.lang-switch svg { width: 15px; height: 15px; }
.mobile-nav { position: relative; }
.mobile-nav > summary { display: inline-flex; flex: none; align-items: center; white-space: nowrap; gap: 8px; padding: 7px 12px; border: 1px solid var(--ink); border-radius: 2px; color: var(--ink); font-weight: 600; cursor: pointer; list-style: none; }
.mobile-nav > summary::-webkit-details-marker { display: none; }
.mobile-nav > summary svg { width: 18px; height: 18px; }
.mobile-nav[open] > summary { background: var(--ink); color: #fff; }
.mobile-nav__panel { position: absolute; right: 0; top: calc(100% + 8px); width: min(86vw, 320px); padding: 8px 0; background: var(--paper); border: 1px solid var(--rule); box-shadow: 4px 4px 0 rgba(22, 22, 22, 0.08); }
.mobile-nav__panel a { display: block; padding: 11px 18px; color: var(--ink); font-weight: 600; text-decoration: none; }
.mobile-nav__panel a:hover { background: var(--wash); }
.mobile-nav__panel a[aria-current] { box-shadow: inset 3px 0 0 var(--ink); }
.mobile-nav__sub { display: grid; margin: 0 0 4px 18px; border-left: 1px solid var(--line); }
.mobile-nav__sub a { padding: 8px 14px; font-size: 0.95rem; font-weight: 400; }
.mobile-nav__panel hr { margin: 8px 0; }
@media (min-width: 980px) {
  .site-nav, .header-actions { display: flex; }
  .mobile-nav { display: none; }
}

.announcement { background: var(--purple); color: #fff; font-size: 0.875rem; font-weight: 500; }
.announcement .container { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 4px 12px; min-height: 38px; padding-top: 6px; padding-bottom: 6px; text-align: center; }
.announcement a { color: #fff; text-decoration: underline; }

.hero { position: relative; padding: 56px 0 24px; }
.hero__grid { position: relative; display: grid; gap: 40px; grid-template-columns: minmax(0, 1fr); align-items: end; }
@media (min-width: 960px) { .hero { padding: 88px 0 40px; } .hero__grid { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 64px; } }
.hero__eyebrow { margin-bottom: 22px; }
.hero__title { font-size: clamp(2.6rem, 7vw, 5rem); line-height: 1.02; letter-spacing: -0.01em; }
.hero__subtitle { margin-top: 12px; color: var(--muted); font-family: var(--font-serif); font-size: clamp(1.1rem, 2vw, 1.4rem); font-style: italic; }
.hero__tagline { margin-top: 32px; color: var(--ink); font-size: 1.2rem; font-weight: 600; text-decoration: underline; text-decoration-color: var(--highlight); text-decoration-thickness: 0.42em; text-underline-offset: -0.28em; text-decoration-skip-ink: none; }
.hero__intro { margin-top: 20px; max-width: 580px; color: var(--ink-soft); font-size: 1.05rem; }
.hero__actions { margin-top: 32px; }
.hero__media { position: relative; }
.hero__photo { position: relative; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; }
@media (max-width: 959px) { .hero__photo { aspect-ratio: 3 / 2; } }

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); border-top: 1px solid var(--rule); border-bottom: 1px solid var(--line); }
.stat { padding: 20px 24px 22px 0; }
.stat + .stat { padding-left: 24px; border-left: 1px solid var(--line); }
.stat__value { color: var(--ink); font-family: var(--font-serif); font-size: 2.4rem; font-weight: 700; line-height: 1.05; }
.stat__label { margin-top: 6px; color: var(--muted); font-size: 0.875rem; }

.pillars { display: grid; gap: 40px 32px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); counter-reset: pillar; }
.pillar { padding-top: 18px; border-top: 1px solid var(--rule); }
.pillar__icon { display: block; margin-bottom: 18px; color: var(--purple); }
.pillar__icon svg { width: 24px; height: 24px; stroke-width: 1.6; }
.pillar__title { font-size: 1.15rem; }
.pillar__text { margin-top: 8px; color: var(--ink-soft); font-size: 0.95rem; }

.page-hero { position: relative; padding: 64px 0 40px; border-bottom: 1px solid var(--line); }
.page-hero__title { font-size: clamp(2.2rem, 5vw, 3.4rem); line-height: 1.08; }
.page-hero__lead { margin-top: 16px; max-width: 680px; color: var(--ink-soft); font-size: 1.1rem; }
.page-hero .tabs { margin-top: 32px; margin-bottom: -40px; }
.page-hero .meta { margin-top: 16px; }
.page-hero .notice { margin-top: 24px; max-width: 860px; }

.tabs { display: flex; flex-wrap: wrap; gap: 0 28px; }
.tab { display: inline-flex; align-items: center; gap: 8px; padding: 10px 0 12px; border-bottom: 3px solid transparent; color: var(--muted); font-size: 0.95rem; font-weight: 600; text-decoration: none; }
.tab:hover { color: var(--ink); text-decoration: none; }
.tab[aria-current="page"] { border-bottom-color: var(--ink); color: var(--ink); }

.people-grid { display: grid; gap: 36px 24px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); }
.person { display: flex; flex-direction: column; }
.person__photo { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; background: var(--wash); filter: grayscale(0.15); }
.person__monogram { display: grid; place-items: center; width: 100%; aspect-ratio: 4 / 5; background: var(--wash); color: var(--ink); font-family: var(--font-serif); font-size: 3.2rem; font-weight: 700; letter-spacing: 0.04em; }
.person__body { display: flex; flex: 1; flex-direction: column; gap: 4px; padding: 14px 0 0; }
.person__title { color: var(--purple); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em; }
.person__name { font-size: 1.2rem; }
.person__affiliation { color: var(--muted); font-size: 0.9rem; }
.person__bio { margin-top: 6px; color: var(--ink-soft); font-size: 0.92rem; }
.person__links { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: auto; padding-top: 10px; }
.person__links a { display: inline-flex; align-items: center; gap: 6px; font-size: 0.875rem; font-weight: 600; }
.person__links svg { width: 15px; height: 15px; }
.person--vacant .person__monogram { background: transparent; border: 1px dashed #c4c4c4; }
.person--vacant .person__name { color: var(--muted); font-family: var(--font-sans); font-size: 1rem; font-weight: 600; }

.dept { padding-top: 20px; border-top: 2px solid var(--rule); }
.dept + .dept { margin-top: 56px; }
.dept__head { display: grid; gap: 8px; margin-bottom: 28px; }
.dept__name { font-size: 1.5rem; }
.dept__text { max-width: 720px; color: var(--ink-soft); }
.dept__people { display: grid; gap: 32px 20px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); }

.course { display: flex; flex-direction: column; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--line); }
.course__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 16px; padding: 16px 0 12px; }
.course__code { color: var(--ink); font-family: var(--font-mono); font-size: 1.3rem; font-weight: 700; letter-spacing: 0.01em; text-decoration: none; }
.course__code:hover { color: var(--purple); text-decoration: underline; }
.course__title { color: var(--ink-soft); font-size: 0.95rem; }
.course__text { padding: 0 0 12px; color: var(--muted); font-size: 0.92rem; }
.course__sessions { display: grid; }
.session-row { display: grid; gap: 10px; padding: 14px 0; border-top: 1px solid var(--line); }
@media (min-width: 640px) { .session-row { grid-template-columns: minmax(0, 1fr) auto; align-items: center; } }
.session-row__main { display: grid; gap: 4px; }
.session-row__label { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-weight: 600; color: var(--ink); }
.session-row__when { color: var(--muted); font-size: 0.9rem; }
.session-row__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.materials { display: flex; flex-wrap: wrap; gap: 8px; }
.material { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border: 1px solid var(--line); border-radius: 2px; color: var(--ink); font-size: 0.85rem; font-weight: 600; text-decoration: none; background: #fff; }
.material:hover { border-color: var(--ink); text-decoration: none; }
.material svg { width: 15px; height: 15px; }

.detail { display: grid; gap: 48px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 960px) { .detail { grid-template-columns: minmax(0, 7fr) minmax(0, 3fr); } }
.detail__cover { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; margin-bottom: 36px; }
.detail__aside { display: grid; gap: 16px; align-content: start; }
@media (min-width: 960px) { .detail__aside { position: sticky; top: 92px; } }
.info-list { display: grid; gap: 0; border-top: 2px solid var(--rule); }
.info-list__row { display: grid; gap: 2px; padding: 12px 0; border-bottom: 1px solid var(--line); }
.info-list__label { color: var(--muted); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em; }
.info-list__value { color: var(--ink); font-weight: 600; }
.backlink { display: flex; width: fit-content; align-items: center; gap: 6px; margin-bottom: 22px; color: var(--muted); font-size: 0.9rem; font-weight: 500; text-decoration: none; }
.backlink:hover { color: var(--ink); text-decoration: underline; }
.backlink svg { width: 15px; height: 15px; transform: rotate(180deg); }

.gallery { display: grid; gap: 28px 20px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); }
.gallery__item { margin: 0; }
.gallery__item img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: var(--wash); }
.gallery__item a:hover img { opacity: 0.88; }
.gallery__item figcaption { padding-top: 8px; color: var(--muted); font-size: 0.85rem; }

.doc-group + .doc-group { margin-top: 40px; }
.doc-group h3 { margin-bottom: 10px; }
.doc-list { display: grid; list-style: none; border-top: 1px solid var(--rule); }
.doc-item { position: relative; display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--line); }
.doc-item:hover .doc-item__title { text-decoration: underline; }
.doc-item__icon { display: grid; place-items: center; flex: none; color: var(--muted); }
.doc-item__icon svg { width: 20px; height: 20px; }
.doc-item__body { display: grid; gap: 2px; min-width: 0; }
.doc-item__title { color: var(--ink); font-weight: 600; text-decoration: none; }
.doc-item__title::after { content: ""; position: absolute; inset: 0; }
.doc-item__meta { color: var(--muted); font-size: 0.85rem; }

.notice { display: flex; gap: 14px; padding: 16px 20px; background: #fffbea; color: var(--ink); border-left: 3px solid var(--gold); }
.notice svg { flex: none; width: 20px; height: 20px; color: var(--ink); margin-top: 3px; }
.notice--integrity { background: var(--purple-wash); border-left-color: var(--purple); }
.notice--integrity svg { color: var(--purple); }
.notice strong { color: var(--ink); }

.empty { padding: 36px 24px; border: 1px dashed #c4c4c4; color: var(--muted); text-align: center; }
.empty strong { display: block; margin-bottom: 6px; color: var(--ink-soft); font-size: 1.05rem; }

.cta-band { display: grid; gap: 24px; padding: 48px clamp(24px, 5vw, 56px); background: var(--purple); color: #fff; }
.cta-band h2 { color: #fff; }
.cta-band p { max-width: 620px; color: rgba(255, 255, 255, 0.82); }
.cta-band .btn--gold { background: #fff; color: var(--purple-deep); }
.cta-band .btn--gold:hover { background: var(--highlight); color: var(--ink); }
@media (min-width: 860px) { .cta-band { grid-template-columns: minmax(0, 1fr) auto; align-items: center; } }

.pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; margin-top: 40px; }

.site-footer { margin-top: 40px; padding: 48px 0 32px; background: var(--paper); border-top: 2px solid var(--rule); color: var(--ink-soft); font-size: 0.92rem; }
.site-footer a { color: var(--ink); text-decoration: none; }
.site-footer a:hover { color: var(--purple); text-decoration: underline; }
.footer-grid { display: grid; gap: 36px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 860px) { .footer-grid { grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr)); } }
.footer-brand .brand { color: var(--ink); }
.footer-brand .brand:hover { text-decoration: none; }
.footer-brand p { margin-top: 16px; max-width: 400px; color: var(--muted); }
.footer-col h2 { margin-bottom: 12px; color: var(--muted); font-family: var(--font-sans); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; }
.footer-col ul { display: grid; gap: 8px; list-style: none; }
.footer-col li { display: flex; align-items: center; gap: 8px; }
.footer-col svg { width: 15px; height: 15px; flex: none; color: var(--muted); }
.footer-qr { width: 112px; margin-top: 12px; padding: 6px; border: 1px solid var(--line); background: #fff; }
.footer-bottom { display: grid; gap: 8px; margin-top: 40px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.82rem; }

@media (max-width: 640px) {
  .container { padding: 0 18px; }
  .people-grid, .dept__people { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 14px; }
  .person__name { font-size: 1.05rem; }
  .person__monogram { font-size: 2.4rem; }
  .section { padding: 52px 0; }
  .section-head { margin-bottom: 28px; }
  .hero { padding: 36px 0 16px; }
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stat, .stat + .stat { padding: 16px 12px 18px 0; border-left: 0; }
  .stat:nth-child(even) { padding-left: 16px; border-left: 1px solid var(--line); }
  .stat:nth-child(n + 3) { border-top: 1px solid var(--line); }
  .stat__value { font-size: 2rem; }
  .page-hero { padding: 44px 0 32px; }
  .page-hero .tabs { margin-bottom: -32px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}

@media print {
  .site-header, .site-footer, .announcement, .btn, .mobile-nav { display: none !important; }
  body { background: #fff; }
}
`;
