import { describe, expect, it } from 'vitest';
import { inlineDisposition } from './content-disposition';

describe('inlineDisposition', () => {
  it('encodes the name as UTF-8 for filename*', () => {
    expect(inlineDisposition('会议记录.pdf')).toBe("inline; filename*=UTF-8''%E4%BC%9A%E8%AE%AE%E8%AE%B0%E5%BD%95.pdf");
  });

  it('escapes characters that would end or confuse the header value', () => {
    expect(inlineDisposition("it's (final)*; x=y.pdf")).toBe("inline; filename*=UTF-8''it%27s%20%28final%29%2A%3B%20x%3Dy.pdf");
  });

  it('decodes back to the original name', () => {
    const name = '2026 年度公开账目 (修订版).pdf';
    const encoded = inlineDisposition(name).split("UTF-8''")[1] ?? '';
    expect(decodeURIComponent(encoded)).toBe(name);
  });
});
