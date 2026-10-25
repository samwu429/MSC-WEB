import { describe, expect, it } from 'vitest';
import { MEDIA_KEY_PATTERN, isMediaKey } from '@msc-web/content';
import { contentTypeOfKey, newMediaKey } from './media-key';

const NOW = new Date('2026-10-25T12:00:00Z');

describe('newMediaKey', () => {
  it('files images under img/ and PDFs under doc/ by year, with the extension of the real type', () => {
    expect(newMediaKey('image/jpeg', NOW)).toMatch(/^img\/2026\/[0-9a-f]{32}\.jpg$/);
    expect(newMediaKey('image/png', NOW)).toMatch(/^img\/2026\/[0-9a-f]{32}\.png$/);
    expect(newMediaKey('image/webp', NOW)).toMatch(/^img\/2026\/[0-9a-f]{32}\.webp$/);
    expect(newMediaKey('application/pdf', NOW)).toMatch(/^doc\/2026\/[0-9a-f]{32}\.pdf$/);
  });

  it('only issues keys that /media serves and that validators accept for the right kind', () => {
    const image = newMediaKey('image/webp', NOW);
    const document = newMediaKey('application/pdf', NOW);
    expect(MEDIA_KEY_PATTERN.test(image) && isMediaKey(image, 'image')).toBe(true);
    expect(MEDIA_KEY_PATTERN.test(document) && isMediaKey(document, 'document')).toBe(true);
  });

  it('never repeats a key', () => {
    const keys = new Set(Array.from({ length: 200 }, () => newMediaKey('image/png', NOW)));
    expect(keys.size).toBe(200);
  });
});

describe('contentTypeOfKey', () => {
  it('maps each issued extension back to its type', () => {
    expect(contentTypeOfKey('img/2026/0123456789abcdef0123456789abcdef.jpg')).toBe('image/jpeg');
    expect(contentTypeOfKey('img/2026/0123456789abcdef0123456789abcdef.webp')).toBe('image/webp');
    expect(contentTypeOfKey('doc/2026/0123456789abcdef0123456789abcdef.pdf')).toBe('application/pdf');
  });

  it('knows no other extension', () => {
    expect(contentTypeOfKey('img/2026/0123456789abcdef0123456789abcdef.svg')).toBeNull();
    expect(contentTypeOfKey('no-extension')).toBeNull();
  });
});
