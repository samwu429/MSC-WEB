import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_SETTINGS, SETTINGS_LIMITS, readStoredSettings, settingsMediaKeys, validateSiteSettings, type Partner } from './site-settings';

const LOGO_KEY = 'img/2026/fedcba9876543210fedcba9876543210.png';

function partner(overrides: Partial<Partner> = {}): Partner {
  return { id: 'p-1', kind: 'sponsor', name: { zh: '示例赞助商', en: 'Sample Sponsor' }, logoKey: null, url: '', ...overrides };
}

function withPartners(items: unknown): unknown {
  return { ...DEFAULT_SITE_SETTINGS, partners: { items } };
}

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

  it('accepts sponsors, partners and partner clubs in the order given', () => {
    const items = [partner({ logoKey: LOGO_KEY, url: 'https://sponsor.example' }), partner({ id: 'p-2', kind: 'club', name: { zh: '', en: 'Chess Club' } })];
    const result = validateSiteSettings(withPartners(items));
    expect(result).toEqual({ ok: true, value: { ...DEFAULT_SITE_SETTINGS, partners: { items } } });
  });

  it('reports each partner problem on its own field', () => {
    const result = validateSiteSettings(
      withPartners([
        partner({ name: { zh: '', en: '' } }),
        { ...partner({ id: 'p-2', url: 'javascript:alert(1)' }), kind: 'enemy' },
        partner({ id: 'p-1', logoKey: 'not-a-key' }),
      ]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.field)).toEqual([
        'partners.items.0.name.zh',
        'partners.items.1.kind',
        'partners.items.1.url',
        'partners.items.2.id',
        'partners.items.2.logoKey',
      ]);
    }
  });

  it('refuses a partner list that is not a list or is too long', () => {
    expect(validateSiteSettings(withPartners('sponsors')).ok).toBe(false);
    const tooMany = Array.from({ length: SETTINGS_LIMITS.partners + 1 }, (_, index) => partner({ id: `p-${index}` }));
    const result = validateSiteSettings(withPartners(tooMany));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((issue) => issue.field)).toEqual(['partners.items']);
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

  it('keeps stored partners and their logos, and starts with none', () => {
    expect(readStoredSettings(null).partners.items).toEqual([]);
    expect(readStoredSettings(JSON.stringify({ partners: { items: 'broken' } })).partners.items).toEqual([]);
    const items = [partner({ logoKey: LOGO_KEY })];
    const settings = readStoredSettings(JSON.stringify({ partners: { items } }));
    expect(settings.partners.items).toEqual(items);
    expect(settingsMediaKeys(settings)).toEqual([LOGO_KEY]);
  });

  it('keeps a stored image key', () => {
    const key = 'img/2026/0123456789abcdef0123456789abcdef.jpg';
    const settings = readStoredSettings(JSON.stringify({ hero: { imageKey: key } }));
    expect(settingsMediaKeys(settings)).toEqual([key]);
  });
});
