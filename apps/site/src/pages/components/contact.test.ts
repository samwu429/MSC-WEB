import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_SETTINGS } from '@msc-web/content';
import { hasContactDetails } from './contact';

describe('hasContactDetails', () => {
  it('is false for the default settings, which have no contact details', () => {
    expect(hasContactDetails(DEFAULT_SITE_SETTINGS.contact)).toBe(false);
  });

  it('is true as soon as any one way to reach the Group is set', () => {
    const empty = DEFAULT_SITE_SETTINGS.contact;
    expect(hasContactDetails({ ...empty, email: 'hello@utmmsc.com' })).toBe(true);
    expect(hasContactDetails({ ...empty, wechatId: 'utmmsc' })).toBe(true);
    expect(hasContactDetails({ ...empty, wechatQrKey: 'img/2026/0123456789abcdef0123456789abcdef.png' })).toBe(true);
    expect(hasContactDetails({ ...empty, githubUrl: 'https://github.com/utmmsc' })).toBe(true);
  });
});
