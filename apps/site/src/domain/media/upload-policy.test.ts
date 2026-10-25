import { describe, expect, it } from 'vitest';
import { JPEG_3X2, PNG_3X2, WEBP_ANIMATED_1X1, minimalPdf, pngWithSize } from './sniffing/testing/fixtures';
import { judgeUpload } from './upload-policy';

describe('judgeUpload', () => {
  it('accepts an image of the image kind and a PDF of the document kind', () => {
    expect(judgeUpload('image', JPEG_3X2)).toEqual({ accepted: true, media: { contentType: 'image/jpeg', width: 3, height: 2 } });
    expect(judgeUpload('document', minimalPdf())).toEqual({ accepted: true, media: { contentType: 'application/pdf', width: null, height: null } });
  });

  it('refuses a file of the other kind', () => {
    expect(judgeUpload('document', PNG_3X2)).toEqual({ accepted: false, reason: 'unsupported_type' });
    expect(judgeUpload('image', minimalPdf())).toEqual({ accepted: false, reason: 'unsupported_type' });
  });

  it('refuses unrecognised bytes and animations', () => {
    expect(judgeUpload('image', WEBP_ANIMATED_1X1)).toEqual({ accepted: false, reason: 'unsupported_type' });
    expect(judgeUpload('image', new TextEncoder().encode('<svg/>'))).toEqual({ accepted: false, reason: 'unsupported_type' });
  });

  it('accepts images up to 12000 pixels a side and 60 megapixels', () => {
    expect(judgeUpload('image', pngWithSize(12_000, 5_000)).accepted).toBe(true);
    expect(judgeUpload('image', pngWithSize(7_500, 8_000)).accepted).toBe(true);
  });

  it('refuses images wider, taller or larger than the limits', () => {
    for (const [width, height] of [
      [12_001, 10],
      [10, 12_001],
      [8_000, 7_501],
    ] as const) {
      expect(judgeUpload('image', pngWithSize(width, height)), `${width}x${height}`).toEqual({ accepted: false, reason: 'image_too_large' });
    }
  });
});
