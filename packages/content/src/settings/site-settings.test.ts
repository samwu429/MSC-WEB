import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_SETTINGS, readStoredSettings, settingsMediaKeys, validateSiteSettings } from './site-settings';

describe('validateSiteSettings', () => {
  it('accepts the defaults', () => {
    expect(validateSiteSettings(DEFAULT_SITE_SETTINGS)).toEqual({ ok: true, value: DEFAULT_SITE_SETTINGS });
  });

  it('requires announcement text when the bar is on', () => {
    const result = validateSiteSettings({ ...DEFAULT_SITE_SETTINGS, announcement: { enabled: true, text: { zh: '', en: '' }, url: '' } });
    expect(result.ok).toBe(false);
  });

  it('refuses a join link that only looks like a site path', () => {
    const result = validateSiteSettings({ ...DEFAULT_SITE_SETTINGS, join: { ...DEFAULT_SITE_SETTINGS.join, url: '/\t/evil.example' } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((issue) => issue.field)).toEqual(['join.url']);
  });

  it('refuses a script address in contact links', () => {
    const result = validateSiteSettings({ ...DEFAULT_SITE_SETTINGS, contact: { ...DEFAULT_SITE_SETTINGS.contact, instagramUrl: 'javascript:alert(1)' } });
    expect(result.ok).toBe(false);
  });
});

describe('readStoredSettings', () => {
  it('fills fields missing from an older copy with defaults', () => {
    const stored = JSON.stringify({ hero: { tagline: { zh: '新标语', en: 'New' } } });
    const settings = readStoredSettings(stored);
    expect(settings.hero.tagline).toEqual({ zh: '新标语', en: 'New' });
    expect(settings.hero.intro).toEqual(DEFAULT_SITE_SETTINGS.hero.intro);
    expect(settings.contact).toEqual(DEFAULT_SITE_SETTINGS.contact);
  });

  it('ignores values of the wrong type and broken JSON', () => {
    expect(readStoredSettings(JSON.stringify({ announcement: { enabled: 'yes' } })).announcement.enabled).toBe(false);
    expect(readStoredSettings('{not json')).toEqual(DEFAULT_SITE_SETTINGS);
    expect(readStoredSettings(null)).toEqual(DEFAULT_SITE_SETTINGS);
  });

  it('keeps a stored image key', () => {
    const key = 'img/2026/0123456789abcdef0123456789abcdef.jpg';
    const settings = readStoredSettings(JSON.stringify({ hero: { imageKey: key } }));
    expect(settingsMediaKeys(settings)).toEqual([key]);
  });
});
