import { describe, expect, it } from 'vitest';
import { sniffMedia } from './sniff';
import {
  JPEG_3X2,
  PNG_3X2,
  WEBP_ANIMATED_1X1,
  WEBP_EXTENDED_1X1,
  WEBP_LOSSLESS_1X1,
  WEBP_LOSSY_1X1,
  concatBytes,
  minimalPdf,
} from './testing/fixtures';

const text = (value: string) => new TextEncoder().encode(value);

describe('sniffMedia', () => {
  it('reads the size of a JPEG from its frame header', () => {
    expect(sniffMedia(JPEG_3X2)).toEqual({ contentType: 'image/jpeg', width: 3, height: 2 });
  });

  it('accepts bytes a camera appended after the end of a JPEG', () => {
    expect(sniffMedia(concatBytes(JPEG_3X2, text('trailing camera data')))?.contentType).toBe('image/jpeg');
  });

  it('reads the size of a PNG from its IHDR chunk', () => {
    expect(sniffMedia(PNG_3X2)).toEqual({ contentType: 'image/png', width: 3, height: 2 });
  });

  it('reads lossy, lossless and extended still WebP images', () => {
    for (const bytes of [WEBP_LOSSY_1X1, WEBP_LOSSLESS_1X1, WEBP_EXTENDED_1X1]) {
      expect(sniffMedia(bytes)).toEqual({ contentType: 'image/webp', width: 1, height: 1 });
    }
  });

  it('recognises a PDF without a pixel size', () => {
    expect(sniffMedia(minimalPdf())).toEqual({ contentType: 'application/pdf', width: null, height: null });
  });

  it('accepts a PDF whose end marker is followed by a little padding', () => {
    expect(sniffMedia(concatBytes(minimalPdf(), new Uint8Array(1000)))?.contentType).toBe('application/pdf');
  });

  it('refuses an animated WebP', () => {
    expect(sniffMedia(WEBP_ANIMATED_1X1)).toBeNull();
  });

  it('refuses files that were cut off', () => {
    expect(sniffMedia(JPEG_3X2.slice(0, 100))).toBeNull();
    expect(sniffMedia(JPEG_3X2.slice(0, JPEG_3X2.length - 2))).toBeNull();
    expect(sniffMedia(PNG_3X2.slice(0, 20))).toBeNull();
    expect(sniffMedia(WEBP_LOSSY_1X1.slice(0, 30))).toBeNull();
    const pdf = minimalPdf();
    expect(sniffMedia(pdf.slice(0, pdf.length - 8))).toBeNull();
  });

  it('refuses a PDF whose end marker is far from the end of the file', () => {
    expect(sniffMedia(concatBytes(minimalPdf(), new Uint8Array(4096)))).toBeNull();
  });

  it('refuses formats the site never serves, whatever they are called', () => {
    expect(sniffMedia(text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(sniffMedia(text('<!doctype html><title>x</title>'))).toBeNull();
    expect(sniffMedia(text('GIF89a\u0001\u0000\u0001\u0000'))).toBeNull();
    expect(sniffMedia(new Uint8Array(0))).toBeNull();
  });

  it('refuses a JPEG whose scan comes before any frame header', () => {
    const frameStart = JPEG_3X2.findIndex((byte, index) => byte === 0xff && JPEG_3X2[index + 1] === 0xc0);
    const withoutFrame = JPEG_3X2.slice();
    withoutFrame[frameStart + 1] = 0xe1;
    expect(sniffMedia(withoutFrame)).toBeNull();
  });

  it('refuses a PNG that declares no pixels', () => {
    const empty = PNG_3X2.slice();
    new DataView(empty.buffer).setUint32(16, 0);
    expect(sniffMedia(empty)).toBeNull();
  });
});
