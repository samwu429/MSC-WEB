import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app';
import { createTestEnv, type TestEnv } from '../../testing/test-env';
import { sqlite } from '../../../infrastructure/d1/testing/sqlite-d1';
import { seedCourse, seedEvent, seedSession } from '../../../infrastructure/d1/public/testing/seed';
import { sitemapXml } from './sitemap';

describe.skipIf(!sqlite)('sitemap.xml', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  function locs(xml: string): string[] {
    return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1] ?? '');
  }

  it('lists every section, the Our People pages, visible people, published events and reviewed courses, once each', async () => {
    test.d1.exec(`
      INSERT INTO people (id, section, position, name_zh, name_en, visible, created_at, updated_at) VALUES
        ('per_wang', 'presidium', 'president', '王会长', 'Wang Hui', 1, '2026-09-01T00:00:00.000Z', '2026-09-05T00:00:00.000Z'),
        ('per_hidden', 'presidium', 'secretary_general', '隐藏', 'Hidden', 0, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z');
    `);
    seedEvent(test.d1, { slug: '2026-10-mid-autumn', startsAt: '2026-10-03T18:00', updatedAt: '2026-10-04T08:00:00.000Z' });
    seedEvent(test.d1, { slug: 'secret-plan', startsAt: '2026-11-01T18:00', status: 'draft' });
    const csc = seedCourse(test.d1, { code: 'CSC108H5', updatedAt: '2026-09-01T00:00:00.000Z' });
    seedSession(test.d1, { courseId: csc, term: '2026-fall', updatedAt: '2026-10-12T00:00:00.000Z' });
    seedSession(test.d1, { courseId: seedCourse(test.d1, { code: 'MAT135H5' }), term: '2026-fall', status: 'draft' });
    seedSession(test.d1, { courseId: seedCourse(test.d1, { code: 'ECO101H5', visible: false }), term: '2026-fall' });

    const response = await app.request('/sitemap.xml', {}, test.env);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
    const xml = await response.text();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(locs(xml)).toEqual([
      'https://utmmsc.com/',
      'https://utmmsc.com/events',
      'https://utmmsc.com/reviews',
      'https://utmmsc.com/people',
      'https://utmmsc.com/about',
      'https://utmmsc.com/people/advisors',
      'https://utmmsc.com/people/presidium',
      'https://utmmsc.com/people/departments',
      'https://utmmsc.com/people/per_wang',
      'https://utmmsc.com/events/2026-10-mid-autumn',
      'https://utmmsc.com/reviews/csc108h5',
    ]);
    expect(xml).toContain('<loc>https://utmmsc.com/events/2026-10-mid-autumn</loc>\n    <lastmod>2026-10-04T08:00:00.000Z</lastmod>');
    expect(xml).toContain('<loc>https://utmmsc.com/reviews/csc108h5</loc>\n    <lastmod>2026-10-12T00:00:00.000Z</lastmod>');
    expect(xml).not.toContain('xhtml');
    expect(xml).not.toContain('/en/');
    expect(xml).toContain('<loc>https://utmmsc.com/people/per_wang</loc>\n    <lastmod>2026-09-05T00:00:00.000Z</lastmod>');
    expect(xml.match(/<lastmod>/g)).toHaveLength(3);
  });

  it('builds absolute addresses from the configured origin and escapes them', async () => {
    const xml = await sitemapXml({ ...test.env, PUBLIC_ORIGIN: 'https://preview.example.com/a&b/' });
    expect(locs(xml)[0]).toBe('https://preview.example.com/a&amp;b/');
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});
