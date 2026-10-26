import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mediaUrl } from '@msc-web/content';
import { app } from '../../../app';
import { createTestEnv, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const AT = '2026-09-01T00:00:00.000Z';
const PHOTO_KEY = 'img/2026/0123456789abcdef0123456789abcdef.jpg';

/** Noon on Sunday 25 October 2026 in Toronto (EDT), inside the Fall 2026 term. */
/** 多伦多时间 2026 年 10 月 25 日（周日）中午（夏令时），位于 2026 秋季学期内。 */
const NOW = new Date('2026-10-25T16:00:00.000Z');

function occurrences(html: string, text: string): number {
  return html.split(text).length - 1;
}

describe.skipIf(!sqlite)('home page', () => {
  let test: TestEnv;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    test = createTestEnv();
  });

  afterEach(() => {
    test.close();
    vi.useRealTimers();
  });

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
        key: PHOTO_KEY,
        url: mediaUrl(PHOTO_KEY),
        kind: 'image',
        contentType: 'image/jpeg',
        size: 4,
        width: 1600,
        height: 1200,
        fileName: 'photo.jpg',
        createdAt: AT,
      },
      'mem_president',
    );
    await test.media.bucket.put(PHOTO_KEY, new Uint8Array([255, 216, 255, 224]));
    await test.d1.db
      .prepare("INSERT INTO settings (key, value, updated_at, updated_by) VALUES ('site', ?, ?, 'mem_president')")
      .bind(JSON.stringify({ hero: { imageKey: PHOTO_KEY }, contact: { githubUrl: 'https://github.com/utmmsc' } }), AT)
      .run();
    test.d1.exec(`
      INSERT INTO events (id, slug, category, status, title_zh, title_en, starts_at, ends_at, created_at, updated_at) VALUES
        ('evt-ongoing', '2026-10-ongoing-talk', 'academic', 'published', '进行中讲座', 'Ongoing Talk', '2026-10-25T10:00', '2026-10-25T14:00', '${AT}', '${AT}'),
        ('evt-next', '2026-10-next-social', 'extracurricular', 'published', '近期联谊', 'Next Social', '2026-10-30T18:00', NULL, '${AT}', '${AT}'),
        ('evt-later', '2026-11-workshop', 'academic', 'published', '十一月工作坊', 'November Workshop', '2026-11-05T18:00', NULL, '${AT}', '${AT}'),
        ('evt-fourth', '2026-11-fourth', 'academic', 'published', '第四场活动', 'Fourth Event', '2026-11-20T18:00', NULL, '${AT}', '${AT}'),
        ('evt-past', '2026-10-past', 'academic', 'published', '往期活动', 'Past Event', '2026-10-01T18:00', NULL, '${AT}', '${AT}'),
        ('evt-draft', '2026-10-draft', 'academic', 'draft', '草稿活动', 'Draft Event', '2026-10-28T18:00', NULL, '${AT}', '${AT}');
      INSERT INTO event_photos (id, event_id, media_key, sort_order, created_at) VALUES
        ('pho-next', 'evt-next', '${PHOTO_KEY}', 0, '2026-10-20T00:00:00.000Z'),
        ('pho-draft', 'evt-draft', '${PHOTO_KEY}', 0, '2026-10-21T00:00:00.000Z');
      INSERT INTO courses (id, code, title_zh, title_en, visible, created_at, updated_at) VALUES
        ('crs-csc', 'CSC108H5', '计算机科学导论', 'Introduction to Computer Programming', 1, '${AT}', '${AT}'),
        ('crs-mat', 'MAT135H5', '微积分', 'Calculus', 1, '${AT}', '${AT}'),
        ('crs-eco', 'ECO100Y5', '经济学', 'Economics', 0, '${AT}', '${AT}'),
        ('crs-psy', 'PSY100H5', '心理学', 'Psychology', 1, '${AT}', '${AT}');
      INSERT INTO review_sessions (id, course_id, term, exam, status, starts_at, mode, created_at, updated_at) VALUES
        ('ses-csc', 'crs-csc', '2026-fall', 'midterm', 'published', '2026-10-28T18:00', 'in_person', '${AT}', '${AT}'),
        ('ses-csc-draft', 'crs-csc', '2026-fall', 'final', 'draft', NULL, 'online', '${AT}', '${AT}'),
        ('ses-mat', 'crs-mat', '2026-fall', 'midterm', 'draft', NULL, 'online', '${AT}', '${AT}'),
        ('ses-eco', 'crs-eco', '2026-fall', 'midterm', 'published', NULL, 'online', '${AT}', '${AT}'),
        ('ses-psy', 'crs-psy', '2026-winter', 'final', 'published', '2026-04-10T18:00', 'in_person', '${AT}', '${AT}');
      INSERT INTO people (id, section, position, name_zh, name_en, bio_zh, bio_en, visible, created_at, updated_at) VALUES
        ('president', 'presidium', 'president', '王会长', 'Wang Hui', '主席简介', 'President bio', 1, '${AT}', '${AT}'),
        ('secretary', 'presidium', 'secretary_general', '隐藏秘书', 'Hidden Secretary', '', '', 0, '${AT}', '${AT}'),
        ('finance', 'presidium', 'vp_finance', '<script>alert(1)</script>', '', '', '', 1, '${AT}', '${AT}');
    `);
  }

  it.each([
    { path: '/', name: '国语学者联盟', other: 'Mandarin Scholars Coalition', otherLang: 'en-CA', term: '2026 秋季学期', events: '/events' },
    { path: '/en', name: 'Mandarin Scholars Coalition', other: '国语学者联盟', otherLang: 'zh-CN', term: 'Fall 2026', events: '/en/events' },
  ])('renders $path from an empty database with empty states and vacant offices', async ({ path, name, other, otherLang, term, events }) => {
    const html = await render(path);

    expect(occurrences(html, '<h1')).toBe(1);
    expect(html).toContain(`<h1 class="hero__title" id="home-title">${name}</h1>`);
    expect(html).toContain(`<p class="hero__subtitle" lang="${otherLang}">${other}</p>`);
    expect(html).toContain('src="/static/photos/academic-talk.jpg"');
    expect(html).toMatch(/class="hero__photo"[^>]*width="1600" height="1200" loading="eager"/);

    expect(occurrences(html, 'class="stat"')).toBe(1);
    expect(html).toContain('<div class="stat__value">$0</div>');

    expect(occurrences(html, 'class="empty"')).toBe(2);
    expect(html).toContain(`<div class="eyebrow">${term}</div>`);
    expect(occurrences(html, 'class="person person--vacant"')).toBe(4);
    expect(html).not.toContain('class="gallery');
    expect(html).toContain(`href="${events}?type=academic"`);
    expect(html).not.toContain('github.com');
    expect(html).toContain('class="cta-band"');
  });

  it('shows the next three events, published reviews of this term, and the Presidium, without a photo gallery', async () => {
    await seed();
    const html = await render('/');

    const eventOrder = ['进行中讲座', '近期联谊', '十一月工作坊'].map((title) => html.indexOf(title));
    expect(eventOrder.every((index) => index > 0)).toBe(true);
    expect([...eventOrder].sort((a, b) => a - b)).toEqual(eventOrder);
    expect(html).not.toContain('第四场活动');
    expect(html).not.toContain('往期活动');
    expect(html).not.toContain('草稿活动');

    expect(html).toContain('CSC108H5');
    expect(html).not.toContain('MAT135H5');
    expect(html).not.toContain('ECO100Y5');
    expect(html).not.toContain('PSY100H5');

    expect(html).toContain('<div class="stat__value">2</div><div class="stat__label">考前复习场次</div>');
    expect(html).toContain('<div class="stat__value">5</div><div class="stat__label">活动</div>');
    expect(html).toContain('<div class="stat__value">2</div><div class="stat__label">开设复习的课程</div>');

    expect(html).toContain('王会长');
    expect(html).not.toContain('主席简介');
    expect(html).not.toContain('隐藏秘书');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(occurrences(html, 'class="person person--vacant"')).toBe(2);

    expect(html).not.toContain('class="gallery');
    expect(html).not.toContain('alt="近期联谊"');

    expect(html).toContain(`class="hero__photo" src="${mediaUrl(PHOTO_KEY)}"`);
    expect(html).toContain(`<meta property="og:image" content="https://utmmsc.com${mediaUrl(PHOTO_KEY)}"/>`);
    expect(html).toContain('href="https://github.com/utmmsc" rel="noopener noreferrer" target="_blank"');
  });

  it('links events and actions to the English pages on /en', async () => {
    await seed();
    const html = await render('/en');
    expect(html).toContain('Ongoing Talk');
    expect(html).toContain('<a class="card__link" href="/en/events/2026-10-next-social">Next Social</a>');
    expect(html).toContain('href="/en/reviews"');
    expect(html).toContain('href="/en/people"');
    expect(html).toContain('href="/en/people/presidium"');
    expect(html).toContain('<div class="stat__label">Courses with reviews</div>');
  });

  it.each([
    { path: '/', open: '进入成员网络', download: '下载安卓 App', iphone: '添加到主屏幕' },
    { path: '/en', open: 'Open the member network', download: 'Download the Android app', iphone: 'Add to Home Screen' },
  ])('offers the member network and the Android download on $path', async ({ path, open, download, iphone }) => {
    const html = await render(path);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const section = main.slice(main.indexOf('aria-labelledby="home-member-app"'));
    expect(section).toContain('href="/UTMMSC/"');
    expect(section).toContain(open);
    expect(section).toContain('href="/download/android"');
    expect(section).toContain(download);
    expect(section).toContain(iphone);
    expect(main.indexOf('home-member-app')).toBeLessThan(main.indexOf('home-pillars'));
  });

  it('marks editor text shown in the other language with its lang', async () => {
    await seed();
    test.d1.exec("UPDATE events SET title_en = '' WHERE id = 'evt-next'");
    await test.d1.db
      .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
      .bind(JSON.stringify({ hero: { imageKey: PHOTO_KEY, tagline: { zh: '一起学习，一起成长', en: '' }, intro: { zh: '', en: 'A home for Mandarin learners.' } } }))
      .run();

    const english = await render('/en');
    expect(english).toContain('<p class="hero__tagline" lang="zh-CN">一起学习，一起成长</p>');
    expect(english).toContain('<p lang="zh-CN">一起学习，一起成长</p>');
    expect(english).toContain('<div class="prose hero__intro"><p>A home for Mandarin learners.</p></div>');
    expect(english).toContain('<h3 class="card__title" lang="zh-CN"><a class="card__link" href="/en/events/2026-10-next-social">近期联谊</a></h3>');

    const chinese = await render('/');
    expect(chinese).toContain('<p class="hero__tagline">一起学习，一起成长</p>');
    expect(chinese).toContain('<div class="prose hero__intro" lang="en-CA"><p>A home for Mandarin learners.</p></div>');
  });
});
