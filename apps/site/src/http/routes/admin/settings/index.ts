import { Hono } from 'hono';
import { asRecord, settingsMediaKeys, validateSiteSettings, type SettingsResponse } from '@msc-web/content';
import { loadSiteSettings, saveSiteSettings } from '../../../../infrastructure/d1/settings';
import { droppedKeys, releaseMedia } from '../../../../infrastructure/media/release';
import type { AppEnv } from '../../../context';
import { badRequest, stale } from '../../../errors';
import { readJsonBody, validOrThrow } from '../../../request/body';
import { requireMediaKeys } from '../../../request/media';

/**
 * /admin/api/settings: the one form for site-wide copy and contact details. The body carries the version the editor
 * loaded, which is null while the defaults are still in use.
 * /admin/api/settings：编辑全站文案与联系方式的唯一表单。请求体携带编辑者加载时的版本；仍在使用默认值时该版本为空。
 */
export const settingsRoutes = new Hono<AppEnv>();

/** Null is a real version (the defaults); a missing or empty value means the form is out of date. */
/** 空值是一个真实的版本（默认值）；缺失或空字符串说明表单已过时。 */
function readExpectedVersion(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value === 'string' && value) return value;
  throw badRequest('missing_version', '请刷新页面后再保存');
}

settingsRoutes.get('/', async (c) => {
  const response: SettingsResponse = await loadSiteSettings(c.env.DB);
  return c.json(response);
});

settingsRoutes.put('/', async (c) => {
  const body = asRecord(await readJsonBody(c));
  const expectedUpdatedAt = readExpectedVersion(body.expectedUpdatedAt);
  const settings = validOrThrow(validateSiteSettings(body.settings));
  const current = await loadSiteSettings(c.env.DB);
  if (current.updatedAt !== expectedUpdatedAt) throw stale();
  await requireMediaKeys(c.env.DB, [
    { field: 'hero.imageKey', key: settings.hero.imageKey, kind: 'image' },
    { field: 'contact.wechatQrKey', key: settings.contact.wechatQrKey, kind: 'image' },
    ...settings.partners.items.map((partner, index) => ({ field: `partners.items.${index}.logoKey`, key: partner.logoKey, kind: 'image' as const })),
  ]);

  const saved = await saveSiteSettings(c.env.DB, c.get('identity'), settings, expectedUpdatedAt);
  if (saved.outcome === 'stale') throw stale();
  c.executionCtx.waitUntil(releaseMedia(c.env, droppedKeys(settingsMediaKeys(current.settings), settingsMediaKeys(settings))));
  const response: SettingsResponse = saved.stored;
  return c.json(response);
});
