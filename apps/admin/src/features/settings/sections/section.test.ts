import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_SETTINGS } from '@msc-web/content';
import { patchSettings } from './section';

const IMAGE_KEY = 'img/2026/0123456789abcdef0123456789abcdef.jpg';

describe('patchSettings', () => {
  it('keeps edits made while an image upload was running', () => {
    const typed = patchSettings(DEFAULT_SITE_SETTINGS, 'hero', { tagline: { zh: '新的标语', en: 'A new tagline' } });
    const announced = patchSettings(typed, 'announcement', { enabled: true, text: { zh: '报名周五截止', en: '' } });
    const uploaded = patchSettings(announced, 'hero', { imageKey: IMAGE_KEY });
    expect(uploaded.hero).toEqual({ ...DEFAULT_SITE_SETTINGS.hero, tagline: { zh: '新的标语', en: 'A new tagline' }, imageKey: IMAGE_KEY });
    expect(uploaded.announcement).toMatchObject({ enabled: true, text: { zh: '报名周五截止', en: '' } });
  });

  it('changes only the patched group and leaves the input untouched', () => {
    const patched = patchSettings(DEFAULT_SITE_SETTINGS, 'contact', { wechatQrKey: IMAGE_KEY });
    expect(patched.contact).toEqual({ ...DEFAULT_SITE_SETTINGS.contact, wechatQrKey: IMAGE_KEY });
    expect(patched.hero).toBe(DEFAULT_SITE_SETTINGS.hero);
    expect(DEFAULT_SITE_SETTINGS.contact.wechatQrKey).toBeNull();
  });
});
