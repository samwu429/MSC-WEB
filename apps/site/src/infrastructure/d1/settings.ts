import { readStoredSettings, type AdminIdentity, type SiteSettings } from '@msc-web/content';
import { changeStatement } from './change-log';
import { nextVersion } from './records';

/** The settings row that holds SiteSettings. */
/** 保存 SiteSettings 的设置行。 */
export const SITE_SETTINGS_KEY = 'site';

/** The change log label for every settings save. */
/** 每次保存设置时修改记录使用的标签。 */
const SETTINGS_SUMMARY = '网站设置';

export interface StoredSettings {
  settings: SiteSettings;
  /** Null until the settings are first saved; the defaults are in use. */
  /** 首次保存之前为空，此时使用默认值。 */
  updatedAt: string | null;
}

/** The site settings laid over the defaults, as every public page and the settings form read them. */
/** 覆盖在默认值之上的网站设置，每个公开页面与设置表单都这样读取。 */
export async function loadSiteSettings(db: D1Database): Promise<StoredSettings> {
  const row = await db.prepare('SELECT value, updated_at FROM settings WHERE key = ?').bind(SITE_SETTINGS_KEY).first<{ value: string; updated_at: string }>();
  return { settings: readStoredSettings(row?.value ?? null), updatedAt: row?.updated_at ?? null };
}

export type SettingsSave = { outcome: 'saved'; stored: StoredSettings } | { outcome: 'stale' };

/**
 * Saves validated settings over the version the editor loaded. A null version means the editor saw the defaults,
 * so the row is created only if nobody has created it since; otherwise the row changes only while it still carries
 * that version. Either way a save that changes nothing is stale.
 * 在编辑者加载的版本之上保存已校验的设置。版本为空表示编辑者看到的是默认值，因此只有在此后无人创建该行时才会创建；
 * 否则只有当该行仍为该版本时才会修改。无论哪种情况，没有改动任何行的保存都视为过期。
 */
export async function saveSiteSettings(
  db: D1Database,
  identity: AdminIdentity,
  settings: SiteSettings,
  expectedUpdatedAt: string | null,
): Promise<SettingsSave> {
  const value = JSON.stringify(settings);
  const updatedAt = nextVersion(expectedUpdatedAt);
  const write =
    expectedUpdatedAt === null
      ? db
          .prepare('INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO NOTHING')
          .bind(SITE_SETTINGS_KEY, value, updatedAt, identity.memberId)
      : db
          .prepare('UPDATE settings SET value = ?, updated_at = ?, updated_by = ? WHERE key = ? AND updated_at = ?')
          .bind(value, updatedAt, identity.memberId, SITE_SETTINGS_KEY, expectedUpdatedAt);
  const [result] = await db.batch([
    write,
    changeStatement(db, identity, { action: 'update', entity: 'settings', entityId: SITE_SETTINGS_KEY, summary: SETTINGS_SUMMARY }),
  ]);
  if ((result?.meta.changes ?? 0) === 0) return { outcome: 'stale' };
  return { outcome: 'saved', stored: { settings, updatedAt } };
}
