import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SITE_SETTINGS, type AdminIdentity, type SiteSettings } from '@msc-web/content';
import { loadSiteSettings, saveSiteSettings } from './settings';
import { createSqliteD1, sqlite, type SqliteD1 } from './testing/sqlite-d1';

const EDITOR: AdminIdentity = {
  memberId: 'mem_publicity',
  displayName: '测试宣传部长',
  role: 'head_publicity',
  roleLabel: { zh: '宣传部部长', en: 'Head of Publicity' },
  permissions: ['settings.edit', 'events.edit'],
  source: 'member',
};

function withEmail(email: string): SiteSettings {
  return { ...DEFAULT_SITE_SETTINGS, contact: { ...DEFAULT_SITE_SETTINGS.contact, email } };
}

describe.skipIf(!sqlite)('site settings repository', () => {
  let d1: SqliteD1;

  beforeEach(() => {
    d1 = createSqliteD1();
  });

  afterEach(() => d1.close());

  it('reads the defaults with no version before the first save', async () => {
    expect(await loadSiteSettings(d1.db)).toEqual({ settings: DEFAULT_SITE_SETTINGS, updatedAt: null });
  });

  it('creates the settings on the first save and records who saved them', async () => {
    const saved = await saveSiteSettings(d1.db, EDITOR, withEmail('hello@utmmsc.com'), null);
    if (saved.outcome !== 'saved') throw new Error('expected the first save to succeed');
    expect(await loadSiteSettings(d1.db)).toEqual(saved.stored);
    expect(d1.rows('SELECT updated_by FROM settings')).toEqual([{ updated_by: 'mem_publicity' }]);
    expect(d1.rows('SELECT action, entity, entity_id, summary FROM change_log')).toEqual([
      { action: 'update', entity: 'settings', entity_id: 'site', summary: '网站设置' },
    ]);
  });

  it('refuses a second first save, so an editor who saw the defaults cannot overwrite a saved copy', async () => {
    await saveSiteSettings(d1.db, EDITOR, withEmail('first@utmmsc.com'), null);
    expect(await saveSiteSettings(d1.db, EDITOR, withEmail('second@utmmsc.com'), null)).toEqual({ outcome: 'stale' });
    expect((await loadSiteSettings(d1.db)).settings.contact.email).toBe('first@utmmsc.com');
  });

  it('saves over the loaded version with a later one and refuses the older one afterwards', async () => {
    const first = await saveSiteSettings(d1.db, EDITOR, withEmail('first@utmmsc.com'), null);
    if (first.outcome !== 'saved' || first.stored.updatedAt === null) throw new Error('expected the first save to succeed');
    const version = first.stored.updatedAt;

    const second = await saveSiteSettings(d1.db, EDITOR, withEmail('second@utmmsc.com'), version);
    if (second.outcome !== 'saved' || second.stored.updatedAt === null) throw new Error('expected the second save to succeed');
    expect(second.stored.updatedAt > version).toBe(true);

    expect(await saveSiteSettings(d1.db, EDITOR, withEmail('third@utmmsc.com'), version)).toEqual({ outcome: 'stale' });
    expect(await loadSiteSettings(d1.db)).toEqual(second.stored);
  });

  it('treats a version for settings that were never saved as stale', async () => {
    expect(await saveSiteSettings(d1.db, EDITOR, DEFAULT_SITE_SETTINGS, '2026-01-01T00:00:00.000Z')).toEqual({ outcome: 'stale' });
    expect((await loadSiteSettings(d1.db)).updatedAt).toBeNull();
  });
});
