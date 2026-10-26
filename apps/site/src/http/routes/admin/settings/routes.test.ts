import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SITE_SETTINGS, mediaUrl, type ApiErrorBody, type SettingsResponse, type SiteSettings } from '@msc-web/content';
import { app } from '../../../app';
import { TEST_TOKENS, asOfficer, createTestEnv, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const HERO_A = 'img/2026/0123456789abcdef0123456789abcdef.jpg';
const HERO_B = 'img/2026/fedcba9876543210fedcba9876543210.png';
const QR = 'img/2026/00000000000000000000000000000001.png';

function withImages(heroKey: string | null, qrKey: string | null): SiteSettings {
  return {
    ...DEFAULT_SITE_SETTINGS,
    hero: { ...DEFAULT_SITE_SETTINGS.hero, imageKey: heroKey },
    contact: { ...DEFAULT_SITE_SETTINGS.contact, wechatQrKey: qrKey },
  };
}

describe.skipIf(!sqlite)('settings routes', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  async function save(settings: unknown, expectedUpdatedAt: unknown, token: string = TEST_TOKENS.president) {
    const ctx = testExecutionContext();
    const response = await app.request('/admin/api/settings', asOfficer(token, { settings, expectedUpdatedAt }, 'PUT'), test.env, ctx);
    await ctx.settle();
    return response;
  }

  async function uploadImage(key: string): Promise<void> {
    await insertMedia(
      test.env.DB,
      { key, url: mediaUrl(key), kind: 'image', contentType: 'image/png', size: 3, width: 1, height: 1, fileName: 'a.png', createdAt: '2026-10-01T00:00:00.000Z' },
      'mem_president',
    );
    await test.media.bucket.put(key, new Uint8Array([1, 2, 3]));
  }

  function isStored(key: string): boolean {
    return test.media.objects.has(key) && test.d1.rows('SELECT key FROM media WHERE key = ?', key).length === 1;
  }

  it('answers the defaults with no version before the first save', async () => {
    const response = await app.request('/admin/api/settings', asOfficer(TEST_TOKENS.president), test.env);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ settings: DEFAULT_SITE_SETTINGS, updatedAt: null });
  });

  it('saves the first time with a null version and refuses a second save from the defaults', async () => {
    const first = await save({ ...DEFAULT_SITE_SETTINGS, contact: { ...DEFAULT_SITE_SETTINGS.contact, email: 'Hello@UTMMSC.com' } }, null);
    expect(first.status).toBe(200);
    const saved = (await first.json()) as SettingsResponse;
    expect(saved.settings.contact.email).toBe('hello@utmmsc.com');
    expect(saved.updatedAt).not.toBeNull();
    expect(test.d1.rows('SELECT member_id, entity, entity_id, summary FROM change_log')).toEqual([
      { member_id: 'mem_president', entity: 'settings', entity_id: 'site', summary: '网站设置' },
    ]);

    const second = await save(DEFAULT_SITE_SETTINGS, null);
    expect(second.status).toBe(409);
    expect(((await second.json()) as ApiErrorBody).error.code).toBe('stale');
    const current = (await (await app.request('/admin/api/settings', asOfficer(TEST_TOKENS.president), test.env)).json()) as SettingsResponse;
    expect(current).toEqual(saved);
  });

  it('saves over the version it returned and refuses that version afterwards', async () => {
    const first = (await (await save(DEFAULT_SITE_SETTINGS, null)).json()) as SettingsResponse;
    const second = await save(DEFAULT_SITE_SETTINGS, first.updatedAt);
    expect(second.status).toBe(200);
    const secondBody = (await second.json()) as SettingsResponse;
    expect(first.updatedAt).not.toBeNull();
    expect((secondBody.updatedAt ?? '') > (first.updatedAt ?? '')).toBe(true);
    expect((await save(DEFAULT_SITE_SETTINGS, first.updatedAt)).status).toBe(409);
  });

  it('releases the image the new settings stopped using and keeps the ones still in use', async () => {
    await uploadImage(HERO_A);
    await uploadImage(HERO_B);
    await uploadImage(QR);
    const first = (await (await save(withImages(HERO_A, QR), null)).json()) as SettingsResponse;
    expect(first.settings.hero.imageKey).toBe(HERO_A);

    const second = await save(withImages(HERO_B, QR), first.updatedAt);
    expect(second.status).toBe(200);
    expect(isStored(HERO_A)).toBe(false);
    expect(test.media.objects.has(HERO_A)).toBe(false);
    expect(isStored(HERO_B)).toBe(true);
    expect(isStored(QR)).toBe(true);
  });

  it('keeps every image when a save is refused as stale', async () => {
    await uploadImage(HERO_A);
    await save(withImages(HERO_A, null), null);
    expect((await save(withImages(null, null), null)).status).toBe(409);
    expect(isStored(HERO_A)).toBe(true);
  });

  it('reports every invalid field at once', async () => {
    const settings = {
      ...DEFAULT_SITE_SETTINGS,
      hero: { ...DEFAULT_SITE_SETTINGS.hero, tagline: { zh: '', en: '' } },
      contact: { ...DEFAULT_SITE_SETTINGS.contact, email: 'not an email', instagramUrl: 'javascript:alert(1)' },
    };
    const response = await save(settings, null);
    expect(response.status).toBe(400);
    const body = (await response.json()) as ApiErrorBody;
    expect(body.error.code).toBe('invalid');
    expect(body.error.issues?.map((issue) => issue.field).sort()).toEqual(['contact.email', 'contact.instagramUrl', 'hero.tagline.zh']);
    expect(test.d1.rows('SELECT key FROM settings')).toEqual([]);
  });

  it('reports an upload that does not exist on its own field', async () => {
    await uploadImage(HERO_A);
    const response = await save(withImages(HERO_A, QR), null);
    expect(response.status).toBe(400);
    expect(((await response.json()) as ApiErrorBody).error.issues).toEqual([{ field: 'contact.wechatQrKey', message: '文件不存在，请重新上传' }]);
  });

  it('saves partner logos, checks each one exists, and releases a logo that was removed', async () => {
    await uploadImage(HERO_A);
    const withLogos = (first: string | null, second: string | null): SiteSettings => ({
      ...DEFAULT_SITE_SETTINGS,
      partners: {
        items: [
          { id: 'p-1', kind: 'sponsor', name: { zh: '赞助商', en: '' }, logoKey: first, url: '' },
          { id: 'p-2', kind: 'club', name: { zh: '', en: 'Club' }, logoKey: second, url: 'https://club.example' },
        ],
      },
    });

    const missing = await save(withLogos(HERO_A, QR), null);
    expect(missing.status).toBe(400);
    expect(((await missing.json()) as ApiErrorBody).error.issues).toEqual([{ field: 'partners.items.1.logoKey', message: '文件不存在，请重新上传' }]);

    const saved = (await (await save(withLogos(HERO_A, null), null)).json()) as SettingsResponse;
    expect(saved.settings.partners.items.map((partner) => partner.logoKey)).toEqual([HERO_A, null]);
    expect(isStored(HERO_A)).toBe(true);

    expect((await save(withLogos(null, null), saved.updatedAt)).status).toBe(200);
    expect(isStored(HERO_A)).toBe(false);
  });

  it('requires the version the form loaded', async () => {
    const response = await save(DEFAULT_SITE_SETTINGS, undefined);
    expect(response.status).toBe(400);
    expect(((await response.json()) as ApiErrorBody).error.code).toBe('missing_version');
  });

  it('lets only officers who edit settings save them', async () => {
    expect((await save(DEFAULT_SITE_SETTINGS, null, TEST_TOKENS.academic)).status).toBe(403);
    expect(test.d1.rows('SELECT key FROM settings')).toEqual([]);
  });
});
