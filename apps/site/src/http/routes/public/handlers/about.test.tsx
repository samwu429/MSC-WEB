import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl } from '@msc-web/content';
import { app } from '../../../app';
import { createTestEnv, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const AT = '2026-09-01T00:00:00.000Z';
const PDF_KEY = 'doc/2026/0123456789abcdef0123456789abcdef.pdf';

function occurrences(html: string, text: string): number {
  return html.split(text).length - 1;
}

describe.skipIf(!sqlite)('About page', () => {
  let test: TestEnv;

  beforeEach(() => {
    test = createTestEnv();
  });

  afterEach(() => test.close());

  async function render(path: string): Promise<string> {
    const ctx = testExecutionContext();
    const response = await app.request(path, {}, test.env, ctx);
    await ctx.settle();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).not.toMatch(/<script|\sstyle=/);
    return html;
  }

  async function seed() {
    await insertMedia(
      test.d1.db,
      {
        key: PDF_KEY,
        url: mediaUrl(PDF_KEY),
        kind: 'document',
        contentType: 'application/pdf',
        size: 4,
        width: null,
        height: null,
        fileName: 'record.pdf',
        createdAt: AT,
      },
      'mem_president',
    );
    await test.media.bucket.put(PDF_KEY, new Uint8Array([37, 80, 68, 70]));
    await test.d1.db
      .prepare("INSERT INTO settings (key, value, updated_at, updated_by) VALUES ('site', ?, ?, 'mem_president')")
      .bind(JSON.stringify({ contact: { email: 'hello@utmmsc.com', instagramUrl: 'https://instagram.com/utmmsc/' } }), AT)
      .run();
    test.d1.exec(`
      INSERT INTO documents (id, category, title_zh, title_en, media_key, published_on, visible, sort_order, created_at, updated_at) VALUES
        ('minutes', 'meeting_records', '十月会议纪要 <b>', 'October minutes <b>', '${PDF_KEY}', '2026-10-01', 1, 0, '${AT}', '${AT}'),
        ('accounts', 'public_accounts', '2025 年度公开账目', '2025 Public Accounts', '${PDF_KEY}', '2026-05-01', 1, 0, '${AT}', '${AT}'),
        ('constitution', 'constitution', '联盟章程', 'Constitution', '${PDF_KEY}', '2026-09-01', 1, 0, '${AT}', '${AT}'),
        ('hidden', 'election_results', '隐藏的选举结果', 'Hidden results', '${PDF_KEY}', '2026-04-01', 0, 0, '${AT}', '${AT}');
    `);
  }

  it('renders /about from an empty database with the default copy in English and Chinese and no records', async () => {
    const html = await render('/about');
    const mission = 'UTMMSC contributes to the educational, recreational, social and cultural life of the University.';

    expect(occurrences(html, '<h1')).toBe(1);
    expect(html).toContain('<html lang="en-CA">');
    expect(html).toContain('<h1 class="page-hero__title">About UTMMSC<span class="zh" lang="zh-CN">关于我们</span></h1>');
    expect(html).toContain(`<meta name="description" content="${mission}"/>`);
    expect(html).toContain(`<div class="prose"><p>${mission}</p>`);
    expect(html).toContain('<div class="prose zh-text" lang="zh-CN"><p>UTMMSC 致力于丰富多伦多大学的学业、娱乐、社交与文化生活。</p>');
    expect(html).toContain('class="notice notice--integrity"');
    expect(html).toContain('src="/static/photos/community.jpg"');
    expect(html).toContain('<strong>No records published yet<span class="zh" lang="zh-CN">暂无公开记录</span></strong>');
    expect(html).toContain('<h4 class="pillar__title">Vice-President Supervision &amp; Audit<span class="zh" lang="zh-CN">监督审计副主席</span></h4>');
    expect(occurrences(html, 'class="pillar"')).toBe(4 + 4 + 5);
    expect(html).toContain('href="/UTMMSC/"');
    expect(html).toContain('<a class="section-link link-arrow" href="/people">');
    expect(html).not.toContain('aria-labelledby="about-contact"');
  });

  it('sends the old English address to /about', async () => {
    const ctx = testExecutionContext();
    const response = await app.request('/en/about', {}, test.env, ctx);
    await ctx.settle();
    expect(response.status).toBe(301);
    expect(new URL(response.headers.get('location') ?? '', 'https://utmmsc.com').pathname).toBe('/about');
  });

  it('lists visible records grouped by category and shows the contact details', async () => {
    await seed();
    const html = await render('/about');

    const groups = [
      '<h3>Constitution<span class="zh" lang="zh-CN">章程</span></h3>',
      '<h3>Annual Public Accounts<span class="zh" lang="zh-CN">年度公开账目</span></h3>',
      '<h3>Meeting Records<span class="zh" lang="zh-CN">会议记录</span></h3>',
    ].map((heading) => html.indexOf(heading));
    expect(groups.every((index) => index > 0)).toBe(true);
    expect([...groups].sort((a, b) => a - b)).toEqual(groups);
    expect(html).not.toContain('Election Results');
    expect(html).not.toContain('Hidden results');
    expect(html).not.toContain('隐藏的选举结果');

    expect(html).toContain(`<a class="doc-item__title" href="${mediaUrl(PDF_KEY)}" type="application/pdf">Constitution<span class="zh" lang="zh-CN">联盟章程</span></a>`);
    expect(html).toContain('September 1, 2026 · PDF');
    expect(html).toContain('October minutes &lt;b&gt;<span class="zh" lang="zh-CN">十月会议纪要 &lt;b&gt;</span>');

    expect(html).toContain('aria-labelledby="about-contact"');
    expect(html).toContain('<a href="mailto:hello@utmmsc.com">hello@utmmsc.com</a>');
    expect(html).toContain('<a href="https://instagram.com/utmmsc/" rel="noopener noreferrer" target="_blank">instagram.com/utmmsc</a>');
  });

  it('links the member network and the Android download from the membership section', async () => {
    const html = await render('/about');
    const section = html.slice(html.indexOf('aria-labelledby="about-membership"'));
    expect(section).toContain('href="/UTMMSC/"');
    expect(section).toContain('href="/download/android"');
  });

  it('shows the intro, mission and record titles written in one language once, with lang only on Chinese', async () => {
    await seed();
    test.d1.exec("UPDATE documents SET title_en = '' WHERE id = 'constitution'");
    await test.d1.db
      .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
      .bind(JSON.stringify({ hero: { intro: { zh: '联盟简介。', en: '' } }, about: { mission: { zh: '', en: 'Our mission.' } } }))
      .run();

    const html = await render('/about');
    expect(html).toContain('<p class="page-hero__lead" lang="zh-CN">联盟简介。</p>');
    expect(html).not.toContain('page-hero__lead zh-text');
    expect(html).toContain('<div class="prose"><p>Our mission.</p></div>');
    expect(html).not.toContain('<div class="prose zh-text"');
    expect(html).toContain(`<a class="doc-item__title" href="${mediaUrl(PDF_KEY)}" type="application/pdf"><span lang="zh-CN">联盟章程</span></a>`);
    expect(html).toContain(
      `<a class="doc-item__title" href="${mediaUrl(PDF_KEY)}" type="application/pdf">2025 Public Accounts<span class="zh" lang="zh-CN">2025 年度公开账目</span></a>`,
    );
  });
});
