import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app';
import { createTestEnv, type TestEnv } from '../../testing/test-env';
import { PNG_3X2, minimalPdf } from '../../../domain/media/sniffing/testing/fixtures';
import { sqlite } from '../../../infrastructure/d1/testing/sqlite-d1';
import { putMediaObject } from '../../../infrastructure/r2/media-store';

const IMAGE = 'img/2026/0123456789abcdef0123456789abcdef.png';
const PDF = 'doc/2026/fedcba9876543210fedcba9876543210.pdf';

describe.skipIf(!sqlite)('media route', () => {
  let test: TestEnv;
  let pdf: Uint8Array;

  beforeEach(async () => {
    test = createTestEnv();
    pdf = minimalPdf();
    await putMediaObject(test.media.bucket, IMAGE, PNG_3X2, 'image/png', 'poster.png');
    await putMediaObject(test.media.bucket, PDF, pdf, 'application/pdf', '2026 年度公开账目.pdf');
  });

  afterEach(() => test.close());

  function get(path: string, headers: Record<string, string> = {}, method = 'GET') {
    return app.request(path, { method, headers }, test.env);
  }

  async function bytesOf(response: Response): Promise<Uint8Array> {
    return new Uint8Array(await response.arrayBuffer());
  }

  it('serves an image with long caching, its entity tag and a policy that stops it running anything', async () => {
    const response = await get(`/media/${IMAGE}`);
    expect(response.status).toBe(200);
    expect(await bytesOf(response)).toEqual(PNG_3X2);
    const headers = response.headers;
    expect(headers.get('content-type')).toBe('image/png');
    expect(headers.get('content-length')).toBe(String(PNG_3X2.length));
    expect(headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(headers.get('etag')).toBe(`"${test.media.objects.get(IMAGE)?.etag}"`);
    expect(headers.get('last-modified')).toBe(test.media.objects.get(IMAGE)?.uploaded.toUTCString());
    expect(headers.get('accept-ranges')).toBe('bytes');
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('content-security-policy')).toBe("default-src 'none'; style-src 'unsafe-inline'; sandbox");
    expect(headers.get('content-disposition')).toBeNull();
  });

  it('serves a PDF inline under its original name', async () => {
    const response = await get(`/media/${PDF}`);
    expect(response.status).toBe(200);
    expect(await bytesOf(response)).toEqual(pdf);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toBe(`inline; filename*=UTF-8''${encodeURIComponent('2026 年度公开账目.pdf')}`);
  });

  it('names a PDF without a stored name document.pdf and types a file without a stored type by its key', async () => {
    await test.media.bucket.put(PDF, pdf);
    const response = await get(`/media/${PDF}`);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toBe("inline; filename*=UTF-8''document.pdf");
  });

  it('never repeats a stored type the site does not issue', async () => {
    await putMediaObject(test.media.bucket, IMAGE, PNG_3X2, 'text/html', 'x.html');
    expect((await get(`/media/${IMAGE}`)).headers.get('content-type')).toBe('image/png');
  });

  it('answers HEAD with the headers and no body', async () => {
    const response = await get(`/media/${IMAGE}`, {}, 'HEAD');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-length')).toBe(String(PNG_3X2.length));
    expect(response.headers.get('etag')).not.toBeNull();
    expect((await bytesOf(response)).length).toBe(0);
  });

  it('answers 404 in plain text for keys of any other shape', async () => {
    for (const path of [
      '/media/img/2026/0123456789ABCDEF0123456789ABCDEF.png',
      '/media/img/2026/0123456789abcdef0123456789abcdef.svg',
      '/media/secret/2026/0123456789abcdef0123456789abcdef.png',
      '/media/img/2026/../../0123456789abcdef0123456789abcdef.png',
      '/media/img%2F2026%2F0123456789abcdef0123456789abcdef.png',
      `/media/${IMAGE}.png`,
      '/media/x',
    ]) {
      const response = await get(path);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('content-type'), path).toContain('text/plain');
    }
  });

  it('answers 404 for a well-formed key with no file', async () => {
    const response = await get('/media/img/2026/11111111111111111111111111111111.jpg');
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not Found');
  });

  it('answers 304 when the browser already holds this version', async () => {
    const etag = (await get(`/media/${IMAGE}`)).headers.get('etag') ?? '';
    for (const header of [etag, `W/${etag}`, `"other", ${etag}`, '*']) {
      const response = await get(`/media/${IMAGE}`, { 'if-none-match': header });
      expect(response.status, header).toBe(304);
      expect(response.headers.get('etag')).toBe(etag);
      expect((await bytesOf(response)).length).toBe(0);
    }
    expect((await get(`/media/${IMAGE}`, { 'if-none-match': '"other"' })).status).toBe(200);
  });

  it('serves a single byte range with 206', async () => {
    const response = await get(`/media/${PDF}`, { range: 'bytes=0-7' });
    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe(`bytes 0-7/${pdf.length}`);
    expect(response.headers.get('content-length')).toBe('8');
    expect(new TextDecoder().decode(await bytesOf(response))).toBe('%PDF-1.4');
  });

  it('serves a suffix range and an open range', async () => {
    const suffix = await get(`/media/${PDF}`, { range: 'bytes=-6' });
    expect(suffix.status).toBe(206);
    expect(suffix.headers.get('content-range')).toBe(`bytes ${pdf.length - 6}-${pdf.length - 1}/${pdf.length}`);
    expect(new TextDecoder().decode(await bytesOf(suffix))).toBe('%%EOF\n');

    const open = await get(`/media/${IMAGE}`, { range: 'bytes=8-' });
    expect(await bytesOf(open)).toEqual(PNG_3X2.slice(8));
  });

  it('answers 416 for a range past the end', async () => {
    const response = await get(`/media/${IMAGE}`, { range: `bytes=${PNG_3X2.length}-` });
    expect(response.status).toBe(416);
    expect(response.headers.get('content-range')).toBe(`bytes */${PNG_3X2.length}`);
  });

  it('serves the whole file for a range header it does not handle', async () => {
    const response = await get(`/media/${IMAGE}`, { range: 'bytes=0-1,4-5' });
    expect(response.status).toBe(200);
    expect(await bytesOf(response)).toEqual(PNG_3X2);
  });

  it('prefers 304 over a range for a version the browser holds', async () => {
    const etag = (await get(`/media/${IMAGE}`)).headers.get('etag') ?? '';
    expect((await get(`/media/${IMAGE}`, { 'if-none-match': etag, range: 'bytes=0-1' })).status).toBe(304);
  });
});
