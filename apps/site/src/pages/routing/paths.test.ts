import { describe, expect, it } from 'vitest';
import { localePath, sectionOfPath, siteHref, splitLocalePath } from './paths';

describe('localePath', () => {
  it('puts English pages under /en and keeps Chinese pages at the root', () => {
    expect(localePath('zh', '/events')).toBe('/events');
    expect(localePath('en', '/events')).toBe('/en/events');
    expect(localePath('zh', '/')).toBe('/');
    expect(localePath('en', '/')).toBe('/en');
    expect(localePath('en', 'about')).toBe('/en/about');
  });

  it('never produces a protocol-relative link from a path with several leading slashes', () => {
    expect(localePath('zh', '//evil.example')).toBe('/evil.example');
    expect(localePath('zh', '///evil.example/x')).toBe('/evil.example/x');
    expect(localePath('en', '//evil.example')).toBe('/en/evil.example');
    expect(localePath('zh', '//')).toBe('/');
    expect(localePath('en', '//')).toBe('/en');
  });
});

describe('splitLocalePath', () => {
  it('reads the language from the /en prefix', () => {
    expect(splitLocalePath('/events')).toEqual({ locale: 'zh', path: '/events' });
    expect(splitLocalePath('/en/events')).toEqual({ locale: 'en', path: '/events' });
    expect(splitLocalePath('/en')).toEqual({ locale: 'en', path: '/' });
    expect(splitLocalePath('/en/')).toEqual({ locale: 'en', path: '/' });
    expect(splitLocalePath('')).toEqual({ locale: 'zh', path: '/' });
    expect(splitLocalePath('/english')).toEqual({ locale: 'zh', path: '/english' });
  });

  it('collapses leading slashes, so the language switch of /en//evil.example stays on the site', () => {
    expect(splitLocalePath('/en//evil.example')).toEqual({ locale: 'en', path: '/evil.example' });
    expect(splitLocalePath('//evil.example')).toEqual({ locale: 'zh', path: '/evil.example' });
    const { path } = splitLocalePath('/en//evil.example');
    expect(localePath('zh', path)).toBe('/evil.example');
  });
});

describe('sectionOfPath', () => {
  it('knows the public sections and their sub-pages only', () => {
    expect(sectionOfPath('/')).toBe('home');
    expect(sectionOfPath('/events/2026-10-mid')).toBe('events');
    expect(sectionOfPath('/people/advisors')).toBe('people');
    expect(sectionOfPath('/eventsx')).toBeNull();
    expect(sectionOfPath('/en/events')).toBeNull();
  });
});

describe('siteHref', () => {
  it('moves a public page path into the visitor language, keeping its query and fragment', () => {
    expect(siteHref('en', '/events/2026-10-mid')).toBe('/en/events/2026-10-mid');
    expect(siteHref('en', '/about')).toBe('/en/about');
    expect(siteHref('en', '/')).toBe('/en');
    expect(siteHref('en', '/events?type=academic')).toBe('/en/events?type=academic');
    expect(siteHref('en', '/reviews#all-courses')).toBe('/en/reviews#all-courses');
    expect(siteHref('en', '/?from=announcement')).toBe('/en?from=announcement');
  });

  it('leaves Chinese links as entered', () => {
    for (const url of ['/events/2026-10-mid', '/', '/about?x=1']) expect(siteHref('zh', url)).toBe(url);
  });

  it('passes through everything that is not a public page', () => {
    for (const url of [
      '/UTMMSC/',
      '/download/android',
      '/media/doc/2026/0123456789abcdef0123456789abcdef.pdf',
      '/static/photos/community.jpg',
      '/admin',
      '/en/events',
      '/en',
      'https://forms.example.com/join',
      'mailto:hello@utmmsc.com',
      '//evil.example',
      '',
    ]) {
      expect(siteHref('en', url), url).toBe(url);
    }
  });
});
