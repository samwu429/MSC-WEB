import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app';
import { createTestEnv, testExecutionContext, type TestEnv } from '../../testing/test-env';
import { sqlite } from '../../../infrastructure/d1/testing/sqlite-d1';

const AT = '2026-09-01T00:00:00.000Z';

function occurrences(html: string, text: string): number {
  return html.split(text).length - 1;
}

function footerOf(html: string): string {
  return html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));
}

/** The header, the announcement bar above it and the phone menu, without the page content. */
/** 页眉、其上方的公告栏以及手机菜单，不含页面内容。 */
function headerOf(html: string): string {
  return html.slice(html.indexOf('<body>'), html.indexOf('<main'));
}

describe.skipIf(!sqlite)('site shell', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => {
    test.close();
    vi.restoreAllMocks();
  });

  async function get(path: string): Promise<{ status: number; html: string }> {
    const ctx = testExecutionContext();
    const response = await app.request(path, {}, test.env, ctx);
    await ctx.settle();
    return { status: response.status, html: await response.text() };
  }

  async function saveSettings(settings: unknown): Promise<void> {
    await test.d1.db
      .prepare("INSERT INTO settings (key, value, updated_at, updated_by) VALUES ('site', ?, ?, 'mem_president')")
      .bind(JSON.stringify(settings), AT)
      .run();
  }

  describe('404 page', () => {
    it('keeps the language switch of /en//evil.example on this site', async () => {
      const { status, html } = await get('/en//evil.example');
      expect(status).toBe(404);
      expect(html).not.toMatch(/href="\/\/[^"]*"/);
      expect(html).toContain('<a class="lang-switch" href="/evil.example" hreflang="zh-CN" lang="zh-CN">');
      expect(html).toContain('<a href="/evil.example" hreflang="zh-CN" lang="zh-CN">中文</a>');
      expect(html).toContain('<link rel="canonical" href="https://utmmsc.com/en/evil.example"/>');
    });

    it.each([
      { path: '/nothing-here', lang: 'zh-CN', title: '页面不存在', home: '/' },
      { path: '/en/nothing-here', lang: 'en-CA', title: 'Page not found', home: '/en' },
    ])('renders $path in its language with a way home', async ({ path, lang, title, home }) => {
      const { status, html } = await get(path);
      expect(status).toBe(404);
      expect(html).toContain(`<html lang="${lang}">`);
      expect(html).toContain(`<h1 class="section-title">${title}</h1>`);
      expect(html).toContain(`<a class="btn btn--primary" href="${home}">`);
      expect(html).toContain('<meta name="robots" content="noindex"/>');
    });
  });

  describe('500 page', () => {
    it.each([
      { path: '/en/about?from=mail', lang: 'en-CA', canonical: 'https://utmmsc.com/en/about', switchHref: '/about?from=mail', explore: 'Explore' },
      { path: '/about?from=mail', lang: 'zh-CN', canonical: 'https://utmmsc.com/about', switchHref: '/en/about?from=mail', explore: '浏览' },
    ])('renders $path like every other page when the database fails', async ({ path, lang, canonical, switchHref, explore }) => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      test.close();
      test = createTestEnv({ PUBLIC_ORIGIN: 'https://utmmsc.com/' });
      test.d1.exec('DROP TABLE settings');

      const { status, html } = await get(path);
      expect(status).toBe(500);
      expect(html).toContain(`<html lang="${lang}">`);
      expect(html).toContain(`<link rel="canonical" href="${canonical}"/>`);
      expect(html).not.toContain('https://utmmsc.com//');
      expect(html).toContain(`class="lang-switch" href="${switchHref}"`);
      const footer = footerOf(html);
      expect(footer).toContain(`<h2>${explore}</h2>`);
      expect(occurrences(footer, 'class="footer-col"')).toBe(2);
    });
  });

  describe('footer', () => {
    it.each([
      { path: '/', contact: '联系我们' },
      { path: '/en', contact: 'Contact' },
    ])('leaves the Contact column out of $path until a contact detail is set', async ({ path, contact }) => {
      const before = footerOf((await get(path)).html);
      expect(occurrences(before, 'class="footer-col"')).toBe(2);
      expect(before).not.toContain(contact);
      expect(before).not.toContain('<h3');

      await saveSettings({ contact: { email: 'hello@utmmsc.com' } });
      const after = footerOf((await get(path)).html);
      expect(occurrences(after, 'class="footer-col"')).toBe(3);
      expect(after).toContain(`<h2>${contact}</h2>`);
      expect(after).toContain('<a href="mailto:hello@utmmsc.com">hello@utmmsc.com</a>');
    });
  });

  describe('editor links', () => {
    beforeEach(async () => {
      await saveSettings({
        announcement: { enabled: true, text: { zh: '中秋晚会报名开始', en: '' }, url: '/events/2026-10-mid' },
        join: { url: '/about' },
      });
    });

    it('sends English visitors to the English page of a site path', async () => {
      const { html } = await get('/en/reviews');
      expect(html).toContain('<a href="/en/events/2026-10-mid" class="link-arrow">');
      expect(footerOf(html)).toContain('<a href="/en/about">Join us</a>');

      const home = (await get('/en')).html;
      expect(home).toContain('<a class="btn btn--gold" href="/en/about">');
      expect(occurrences(home, 'href="/about"')).toBe(0);

      const about = (await get('/en/about')).html;
      expect(about).toContain('<a class="btn btn--primary" href="/en/about">');
    });

    it('keeps the path as entered on Chinese pages', async () => {
      const { html } = await get('/reviews');
      expect(html).toContain('<a href="/events/2026-10-mid" class="link-arrow">');
      expect(footerOf(html)).toContain('<a href="/about">加入我们</a>');
      expect((await get('/')).html).toContain('<a class="btn btn--gold" href="/about">');
    });

    it('marks an announcement shown in the other language with its lang', async () => {
      const english = headerOf((await get('/en/events')).html);
      expect(english).toContain('<span lang="zh-CN">中秋晚会报名开始</span>');
      const chinese = headerOf((await get('/events')).html);
      expect(chinese).toContain('<span>中秋晚会报名开始</span>');
    });
  });

  it('leaves editor links outside the public pages alone', async () => {
    await saveSettings({
      announcement: { enabled: true, text: { zh: '公告', en: 'Notice' }, url: 'https://forms.example.com/mid-autumn' },
      join: { url: '/UTMMSC/' },
    });
    const { html } = await get('/en');
    expect(html).toContain('<a href="https://forms.example.com/mid-autumn" class="link-arrow">');
    expect(html).toContain('<a class="btn btn--gold" href="/UTMMSC/">');
    expect(footerOf(html)).toContain('<a href="/UTMMSC/">Join us</a>');
  });

  describe('language switch', () => {
    it.each([
      { path: '/events?type=academic', href: '/en/events?type=academic', lang: 'en', label: 'English' },
      { path: '/en/events?type=academic', href: '/events?type=academic', lang: 'zh-CN', label: '中文' },
    ])('marks both links on $path with the language they lead to', async ({ path, href, lang, label }) => {
      const header = headerOf((await get(path)).html);
      expect(header).toContain(`<a class="lang-switch" href="${href}" hreflang="${lang}" lang="${lang}">`);
      expect(header).toContain(`<a href="${href}" hreflang="${lang}" lang="${lang}">${label}</a>`);
    });
  });
});
