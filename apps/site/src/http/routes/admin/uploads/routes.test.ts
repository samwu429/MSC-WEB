import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES, MEDIA_KEY_PATTERN, type ApiErrorBody, type UploadResponse } from '@msc-web/content';
import { app } from '../../../app';
import { TEST_TOKENS, createTestEnv, type TestEnv } from '../../../testing/test-env';
import { JPEG_3X2, PNG_3X2, WEBP_ANIMATED_1X1, WEBP_LOSSY_1X1, minimalPdf, pngWithSize } from '../../../../domain/media/sniffing/testing/fixtures';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const YEAR = new Date().getUTCFullYear();

interface MediaRow {
  key: string;
  kind: string;
  content_type: string;
  size: number;
  width: number | null;
  height: number | null;
  file_name: string;
  uploaded_by: string;
}

describe.skipIf(!sqlite)('upload route', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  function upload(query: string, body: BodyInit, token: string = TEST_TOKENS.president, headers: Record<string, string> = {}) {
    return app.request(
      `/admin/api/uploads?${query}`,
      { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/octet-stream', ...headers }, body },
      test.env,
    );
  }

  async function errorOf(response: Response): Promise<ApiErrorBody['error']> {
    return ((await response.json()) as ApiErrorBody).error;
  }

  function mediaRows(): MediaRow[] {
    return test.d1.rows<MediaRow>('SELECT key, kind, content_type, size, width, height, file_name, uploaded_by FROM media');
  }

  it('stores an image under a new key and records it with its real type and size', async () => {
    const response = await upload(`kind=image&name=${encodeURIComponent('C:\\photos\\"招新海报".png')}`, PNG_3X2);
    expect(response.status).toBe(201);
    const { media } = (await response.json()) as UploadResponse;
    expect(media).toMatchObject({ kind: 'image', contentType: 'image/png', size: PNG_3X2.length, width: 3, height: 2, fileName: '招新海报.png' });
    expect(media.key).toMatch(new RegExp(`^img/${YEAR}/[0-9a-f]{32}\\.png$`));
    expect(MEDIA_KEY_PATTERN.test(media.key)).toBe(true);
    expect(media.url).toBe(`/media/${media.key}`);

    const stored = test.media.objects.get(media.key);
    expect(stored?.bytes).toEqual(PNG_3X2);
    expect(stored?.contentType).toBe('image/png');
    expect(stored?.customMetadata).toEqual({ fileName: '招新海报.png' });
    expect(mediaRows()).toEqual([
      { key: media.key, kind: 'image', content_type: 'image/png', size: PNG_3X2.length, width: 3, height: 2, file_name: '招新海报.png', uploaded_by: 'mem_president' },
    ]);
  });

  it('decides the type from the bytes, whatever the client declares', async () => {
    const response = await upload('kind=image&name=photo.png', JPEG_3X2, TEST_TOKENS.president, { 'content-type': 'image/png' });
    expect(response.status).toBe(201);
    const { media } = (await response.json()) as UploadResponse;
    expect(media.contentType).toBe('image/jpeg');
    expect(media.key.endsWith('.jpg')).toBe(true);
    expect(test.media.objects.get(media.key)?.contentType).toBe('image/jpeg');
  });

  it('names an upload without a name after its kind', async () => {
    const response = await upload('kind=image', WEBP_LOSSY_1X1);
    expect(((await response.json()) as UploadResponse).media.fileName).toBe('image.webp');
  });

  it('stores a PDF for officers who edit documents or reviews', async () => {
    for (const token of [TEST_TOKENS.finance, TEST_TOKENS.academic]) {
      const response = await upload('kind=document&name=accounts.pdf', minimalPdf(), token);
      expect(response.status).toBe(201);
      const { media } = (await response.json()) as UploadResponse;
      expect(media).toMatchObject({ kind: 'document', contentType: 'application/pdf', width: null, height: null, fileName: 'accounts.pdf' });
      expect(media.key).toMatch(new RegExp(`^doc/${YEAR}/[0-9a-f]{32}\\.pdf$`));
    }
    expect(mediaRows().map((row) => row.uploaded_by).sort()).toEqual(['mem_academic', 'mem_finance']);
  });

  it('lets any officer upload images but only document editors upload PDFs', async () => {
    expect((await upload('kind=image', PNG_3X2, TEST_TOKENS.events)).status).toBe(201);
    const response = await upload('kind=document', minimalPdf(), TEST_TOKENS.events);
    expect(response.status).toBe(403);
    expect(mediaRows()).toHaveLength(1);
  });

  it('keeps out anyone who is not a signed-in officer', async () => {
    expect((await upload('kind=image', PNG_3X2, TEST_TOKENS.student)).status).toBe(403);
    expect((await app.request('/admin/api/uploads?kind=image', { method: 'POST', body: PNG_3X2 }, test.env)).status).toBe(401);
  });

  it('refuses an unknown kind', async () => {
    for (const query of ['kind=video', 'kind=', '']) {
      const response = await upload(query, PNG_3X2);
      expect(response.status, query).toBe(400);
      expect((await errorOf(response)).code).toBe('invalid_kind');
    }
  });

  it('refuses a file of the wrong type with a message for the requested kind', async () => {
    const pdfAsImage = await upload('kind=image&name=a.png', minimalPdf());
    expect(pdfAsImage.status).toBe(400);
    expect(await errorOf(pdfAsImage)).toEqual({ code: 'unsupported_type', message: '只支持 JPG、PNG 或 WebP 图片' });

    const imageAsPdf = await upload('kind=document&name=a.pdf', PNG_3X2);
    expect(await errorOf(imageAsPdf)).toEqual({ code: 'unsupported_type', message: '只支持 PDF 文件' });

    for (const body of [new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'), WEBP_ANIMATED_1X1, new Uint8Array(0)]) {
      expect((await upload('kind=image', body)).status).toBe(400);
    }
    expect(mediaRows()).toEqual([]);
    expect(test.media.objects.size).toBe(0);
  });

  it('refuses images beyond the pixel limits', async () => {
    const response = await upload('kind=image', pngWithSize(12_001, 100));
    expect(response.status).toBe(400);
    expect((await errorOf(response)).code).toBe('image_too_large');
  });

  it('refuses a declared length over the limit before reading the body', async () => {
    const response = await upload('kind=image', PNG_3X2, TEST_TOKENS.president, { 'content-length': String(MAX_IMAGE_BYTES + 1) });
    expect(response.status).toBe(413);
    expect(await errorOf(response)).toEqual({ code: 'too_large', message: '文件过大，图片不能超过 10 MB' });
  });

  it('stops reading a body that grows past the limit', async () => {
    const chunk = new Uint8Array(1024 * 1024);
    let pulled = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(chunk);
      },
    });
    const request = new Request(`http://localhost/admin/api/uploads?kind=document`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TEST_TOKENS.president}` },
      body: endless,
      duplex: 'half',
    } as RequestInit);
    const response = await app.request(request, undefined, test.env);
    expect(response.status).toBe(413);
    expect((await errorOf(response)).message).toBe('文件过大，PDF 文件不能超过 25 MB');
    expect(pulled).toBeLessThanOrEqual(MAX_DOCUMENT_BYTES / chunk.length + 3);
    expect(mediaRows()).toEqual([]);
  });

  it('accepts a file of exactly the limit', async () => {
    const atLimit = new Uint8Array(MAX_IMAGE_BYTES);
    atLimit.set(PNG_3X2);
    const response = await upload('kind=image', atLimit);
    expect(response.status).toBe(201);
    expect(((await response.json()) as UploadResponse).media.size).toBe(MAX_IMAGE_BYTES);
  });
});
