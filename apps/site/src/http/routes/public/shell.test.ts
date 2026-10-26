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

  async function redirect(path: string): Promise<{ status: number; location: string | null }> {
    const ctx = testExecutionContext();
    const response = await app.request(path, { redirect: 'manual' }, test.env, ctx);
    await ctx.settle();
    return { status: response.status, location: response.headers.get('location') };
  }

  async function saveSettings(settings: unknown): Promise<void> {
    await test.d1.db
      .prepare("INSERT INTO settings (key, value, updated_at, updated_by) VALUES ('site', ?, ?, 'mem_president')")
      .bind(JSON.stringify(settings), AT)
      .run();
  }

  describe('old English addresses', () => {
    it.each([
      { path: '/en', location: '/' },
      { path: '/en/events?type=academic', location: '/events?type=academic' },
      { path: '/en/people/presidium', location: '/people/presidium' },
    ])('moves $path permanently to $location', async ({ path, location }) => {
      expect(await redirect(path)).toEqual({ status: 301, location });
    });

    it('reaches the home page from /en/ through the trailing-slash redirect', async () => {
      const first = await redirect('/en/');
      expect(first.status).toBe(301);
      expect(new URL(first.location ?? '', 'http://localhost').pathname).toBe('/en');
      expect(await redirect('/en')).toEqual({ status: 301, location: '/' });
    });

    it('keeps /en//evil.example on this site', async () => {
      expect(await redirect('/en//evil.example')).toEqual({ status: 301, location: '/evil.example' });
    });
  });

  describe('404 page', () => {
    it('renders in English with the Chinese beneath and a way home', async () => {
      const { status, html } = await get('/nothing-here');
      expect(status).toBe(404);
      expect(html).toContain('<html lang="en-CA">');
      expect(html).toContain('<h1 class="section-title">Page not found<span class="zh" lang="zh-CN">页面不存在</span></h1>');
      expect(html).toContain('<p class="section-lead zh-text" lang="zh-CN">你访问的页面不存在，可能已被移动或删除。</p>');
      expect(html).toContain('<a class="btn btn--primary" href="/">');
      expect(html).toContain('<meta name="robots" content="noindex"/>');
      expect(html).not.toContain('hreflang');
    });
  });

  describe('500 page', () => {
    it('renders like every other page when the database fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      test.close();
      test = createTestEnv({ PUBLIC_ORIGIN: 'https://utmmsc.com/' });
      test.d1.exec('DROP TABLE settings');

      const { status, html } = await get('/about?from=mail');
      expect(status).toBe(500);
      expect(html).toContain('<html lang="en-CA">');
      expect(html).toContain('<link rel="canonical" href="https://utmmsc.com/about"/>');
      expect(html).not.toContain('https://utmmsc.com//');
      expect(html).toContain('<h1 class="section-title">Something went wrong<span class="zh" lang="zh-CN">页面出错了</span></h1>');
      const footer = footerOf(html);
      expect(footer).toContain('<h2>Explore<span class="zh" lang="zh-CN">浏览</span></h2>');
      expect(occurrences(footer, 'class="footer-col"')).toBe(2);
    });
  });

  describe('header', () => {
    it('has no language switch and no alternate-language links', async () => {
      const html = (await get('/events?type=academic')).html;
      expect(headerOf(html)).not.toContain('lang-switch');
      expect(html).not.toContain('hreflang');
      expect(html).not.toContain('href="/en');
    });
  });

  describe('footer', () => {
    it('leaves the Contact column out until a contact detail is set', async () => {
      const before = footerOf((await get('/')).html);
      expect(occurrences(before, 'class="footer-col"')).toBe(2);
      expect(before).not.toContain('Contact');
      expect(before).not.toContain('<h3');

      await saveSettings({ contact: { email: 'hello@utmmsc.com' } });
      const after = footerOf((await get('/')).html);
      expect(occurrences(after, 'class="footer-col"')).toBe(3);
      expect(after).toContain('<h2>Contact<span class="zh" lang="zh-CN">联系我们</span></h2>');
      expect(after).toContain('<a href="mailto:hello@utmmsc.com">hello@utmmsc.com</a>');
    });

    it.each(['/', '/events'])('links %s to the editing backend at /admin/', async (path) => {
      const footer = footerOf((await get(path)).html);
      expect(footer).toMatch(/<a class="footer-admin" href="\/admin\/" rel="nofollow"><svg[^]*?<\/svg>Officer sign-in<\/a>/);
    });
  });

  describe('editor links', () => {
    it('keeps a page path as entered', async () => {
      await saveSettings({
        announcement: { enabled: true, text: { zh: '中秋晚会报名开始', en: '' }, url: '/events/2026-10-mid' },
        join: { url: '/about' },
      });
      const { html } = await get('/reviews');
      expect(html).toContain('<a href="/events/2026-10-mid" class="link-arrow">');
      expect(footerOf(html)).toContain('<a href="/about">Join us</a>');
      expect((await get('/')).html).toContain('<a class="btn btn--gold" href="/about">');
      expect((await get('/about')).html).toContain('<a class="btn btn--primary" href="/about">');
    });

    it('points a link written for the old English pages at the page itself', async () => {
      await saveSettings({
        announcement: { enabled: true, text: { zh: '中秋晚会报名开始', en: '' }, url: '/en/events/2026-10-mid' },
        join: { url: '/en/about' },
      });
      const { html } = await get('/reviews');
      expect(html).toContain('<a href="/events/2026-10-mid" class="link-arrow">');
      expect(footerOf(html)).toContain('<a href="/about">Join us</a>');
      const home = (await get('/')).html;
      expect(home).toContain('<a class="btn btn--gold" href="/about">');
      expect(home).not.toContain('href="/en/');
    });

    it('marks an announcement written only in Chinese with its lang', async () => {
      await saveSettings({ announcement: { enabled: true, text: { zh: '中秋晚会报名开始', en: '' }, url: '' } });
      expect(headerOf((await get('/events')).html)).toContain('<div class="announcement__text"><p lang="zh-CN">中秋晚会报名开始</p></div>');
    });

    it('shows the Chinese of an announcement under the English', async () => {
      await saveSettings({ announcement: { enabled: true, text: { zh: '中秋晚会报名开始', en: 'Mid-Autumn sign-up is open' }, url: '' } });
      expect(headerOf((await get('/events')).html)).toContain(
        '<div class="announcement__text"><p>Mid-Autumn sign-up is open</p><p class="zh-text" lang="zh-CN">中秋晚会报名开始</p></div>',
      );
    });
  });

  it('leaves editor links outside the public pages alone', async () => {
    await saveSettings({
      announcement: { enabled: true, text: { zh: '公告', en: 'Notice' }, url: 'https://forms.example.com/mid-autumn' },
      join: { url: '/UTMMSC/' },
    });
    const { html } = await get('/');
    expect(html).toContain('<a href="https://forms.example.com/mid-autumn" class="link-arrow">');
    expect(html).toContain('<a class="btn btn--gold" href="/UTMMSC/">');
    expect(footerOf(html)).toContain('<a href="/UTMMSC/">Join us</a>');
  });
});
