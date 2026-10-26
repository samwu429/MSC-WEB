import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_SETTINGS } from '@msc-web/content';
import { SITE_LOCALE, buildPageContext } from './context';

const ENV = { MEMBER_APP_URL: '/UTMMSC/', ANDROID_DOWNLOAD_URL: '/download/android', PUBLIC_ORIGIN: 'https://utmmsc.com' };

/** Noon on Sunday 25 October 2026 in Toronto (EDT). */
/** 多伦多时间 2026 年 10 月 25 日（周日）中午（夏令时）。 */
const NOW = new Date('2026-10-25T16:00:00.000Z');

describe('buildPageContext', () => {
  it('takes the path and query from the URL and the Toronto time from the instant', () => {
    const ctx = buildPageContext(new URL('https://utmmsc.com/events?type=academic'), ENV, SITE_LOCALE, DEFAULT_SITE_SETTINGS, NOW);
    expect(ctx.locale).toBe('en');
    expect(ctx.path).toBe('/events');
    expect(ctx.search).toBe('?type=academic');
    expect(ctx.now).toBe('2026-10-25T12:00');
    expect(ctx.currentYear).toBe(2026);
    expect(ctx.settings).toBe(DEFAULT_SITE_SETTINGS);
    expect(ctx.links).toEqual({ memberApp: '/UTMMSC/', android: '/download/android', publicOrigin: 'https://utmmsc.com' });
  });

  it('trims trailing slashes from the public origin, so canonical links never contain "//"', () => {
    const ctx = buildPageContext(new URL('https://utmmsc.com/about'), { ...ENV, PUBLIC_ORIGIN: 'https://utmmsc.com//' }, SITE_LOCALE, DEFAULT_SITE_SETTINGS, NOW);
    expect(ctx.links.publicOrigin).toBe('https://utmmsc.com');
  });

  it('collapses leading slashes of the request path', () => {
    const ctx = buildPageContext(new URL('https://utmmsc.com//evil.example'), ENV, SITE_LOCALE, DEFAULT_SITE_SETTINGS, NOW);
    expect(ctx.path).toBe('/evil.example');
  });
});
