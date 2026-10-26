import { describe, expect, it } from 'vitest';
import { legacyEnglishTarget, rooted, sectionOfPath, siteHref, sitePath } from './paths';

describe('sitePath', () => {
  it('serves every page at the root', () => {
    expect(sitePath('/events')).toBe('/events');
    expect(sitePath('/')).toBe('/');
    expect(sitePath('about')).toBe('/about');
  });

  it('never produces a protocol-relative link from a path with several leading slashes', () => {
    expect(sitePath('//evil.example')).toBe('/evil.example');
    expect(sitePath('///evil.example/x')).toBe('/evil.example/x');
    expect(sitePath('//')).toBe('/');
    expect(rooted('')).toBe('/');
    expect(rooted('//evil.example')).toBe('/evil.example');
  });
});

describe('legacyEnglishTarget', () => {
  it('moves the old /en addresses to the same path at the root', () => {
    expect(legacyEnglishTarget('/en')).toBe('/');
    expect(legacyEnglishTarget('/en/')).toBe('/');
    expect(legacyEnglishTarget('/en/events')).toBe('/events');
    expect(legacyEnglishTarget('/en/people/presidium')).toBe('/people/presidium');
  });

  it('leaves every other path alone', () => {
    expect(legacyEnglishTarget('/events')).toBeNull();
    expect(legacyEnglishTarget('/english')).toBeNull();
    expect(legacyEnglishTarget('/')).toBeNull();
  });

  it('collapses leading slashes, so /en//evil.example stays on the site', () => {
    expect(legacyEnglishTarget('/en//evil.example')).toBe('/evil.example');
    expect(legacyEnglishTarget('/en///evil.example/x')).toBe('/evil.example/x');
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
  it('points a link written for the old English pages at the page itself, keeping its query and fragment', () => {
    expect(siteHref('/en/events/2026-10-mid')).toBe('/events/2026-10-mid');
    expect(siteHref('/en/about')).toBe('/about');
    expect(siteHref('/en')).toBe('/');
    expect(siteHref('/en/events?type=academic#past-events')).toBe('/events?type=academic#past-events');
    expect(siteHref('/en?from=announcement')).toBe('/?from=announcement');
  });

  it('leaves page links as entered', () => {
    for (const url of ['/events/2026-10-mid', '/', '/about?x=1', '/reviews#all-courses']) expect(siteHref(url)).toBe(url);
  });

  it('passes through everything that is not a public page', () => {
    for (const url of [
      '/UTMMSC/',
      '/download/android',
      '/media/doc/2026/0123456789abcdef0123456789abcdef.pdf',
      '/static/photos/community.jpg',
      '/admin',
      '/en/UTMMSC/',
      '/en//evil.example',
      'https://forms.example.com/join',
      'mailto:hello@utmmsc.com',
      '//evil.example',
      '',
    ]) {
      expect(siteHref(url), url).toBe(url);
    }
  });
});
