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
        ('finance', 'presidium', 'vp_finance', '财务部长', 'Finance VP', '', '', 1, '${AT}', '${AT}'),
        ('advisor', 'advisor', 'advisor', '陈教授', 'Prof. Chen', '顾问简介', 'Advisor bio', 1, '${AT}', '${AT}'),
        ('advisor-script', 'advisor', 'advisor', '<script>alert(1)</script>', '', '', '', 1, '${AT}', '${AT}'),
        ('advisor-hidden', 'advisor', 'advisor', '隐藏顾问', 'Hidden Advisor', '', '', 0, '${AT}', '${AT}');
    `);
  }

  it('renders / from an empty database in English with the Chinese beneath, empty states and no people', async () => {
    const html = await render('/');

    expect(occurrences(html, '<h1')).toBe(1);
    expect(html).toContain('<html lang="en-CA">');
    expect(html).toContain('<h1 class="hero__title" id="home-title">Mandarin Scholars Coalition</h1>');
    expect(html).toContain('<p class="hero__subtitle" lang="zh-CN">国语学者联盟</p>');
    expect(html).toContain('<p class="hero__tagline">A home for Mandarin speakers and learners at UTM, built around learning together.</p>');
    expect(html).toContain('<p class="hero__tagline zh-text" lang="zh-CN">用中文相聚，一起学习，一起走进加拿大校园。</p>');
    expect(html).toContain('src="/static/photos/academic-talk.jpg"');
    expect(html).toMatch(/class="hero__photo"[^>]*width="1600" height="1200" loading="eager"/);

    expect(occurrences(html, 'class="stat"')).toBe(1);
    expect(html).toContain('<div class="stat__value">$0</div>');
    expect(html).toContain('<h2 class="stats__title" id="home-stats">UTMMSC at a glance<span class="zh" lang="zh-CN">联盟一览</span></h2>');

    expect(occurrences(html, 'class="empty"')).toBe(4);
    expect(html).toContain('aria-labelledby="home-partners"');
    expect(html).not.toContain('class="partner-group"');
    expect(html).toContain('<div class="eyebrow">Fall 2026</div>');
    expect(html).toContain('<h2 class="section-title" id="home-reviews">Test reviews this term<span class="zh" lang="zh-CN">本学期考前复习</span></h2>');
    expect(html).not.toContain('class="person');
    expect(html).not.toContain('class="gallery');
    expect(html).toContain('href="/events?type=academic"');
    expect(html).not.toContain('href="/en');
    expect(html).not.toContain('github.com');
    expect(html).toContain('class="cta-band"');
    // The join band offers one way in, the member network, with the note that it is made for phones.
    // 加入色带只提供一个入口，即成员网络，并注明其只适配手机端。
    const band = html.slice(html.indexOf('class="cta-band"'), html.indexOf('</section>', html.indexOf('class="cta-band"')));
    expect(band).toContain('<a class="btn btn--primary" href="/UTMMSC/">Member Network</a>');
    expect(band).not.toContain('Join us');
    expect(band).toContain('The Member Network is designed for phones only<span class="zh" lang="zh-CN">成员网络目前只适配手机端</span>');
  });

  it('shows the next three events, published reviews of this term, and the Honorary Advisors, without a photo gallery', async () => {
    await seed();
    const html = await render('/');

    const eventOrder = ['Ongoing Talk', 'Next Social', 'November Workshop'].map((title) => html.indexOf(title));
    expect(eventOrder.every((index) => index > 0)).toBe(true);
    expect([...eventOrder].sort((a, b) => a - b)).toEqual(eventOrder);
    expect(html).toContain('<a class="card__link" href="/events/2026-10-next-social">Next Social<span class="zh" lang="zh-CN">近期联谊</span></a>');
    expect(html).not.toContain('Fourth Event');
    expect(html).not.toContain('Past Event');
    expect(html).not.toContain('Draft Event');

    expect(html).toContain('CSC108H5');
    expect(html).not.toContain('MAT135H5');
    expect(html).not.toContain('ECO100Y5');
    expect(html).not.toContain('PSY100H5');

    expect(html).toContain('<div class="stat__value">2</div><div class="stat__label">Test review sessions<span class="zh" lang="zh-CN">考前复习场次</span></div>');
    expect(html).toContain('<div class="stat__value">5</div><div class="stat__label">Events<span class="zh" lang="zh-CN">活动</span></div>');
    expect(html).toContain('<div class="stat__value">2</div><div class="stat__label">Courses with reviews<span class="zh" lang="zh-CN">开设复习的课程</span></div>');

    // The advisors are people, so they show in English only.
    // 荣誉顾问属于人员内容，因此只显示英文。
    const advisors = html.slice(html.indexOf('aria-labelledby="home-advisors"'), html.indexOf('aria-labelledby="home-partners"'));
    expect(advisors).toContain('Prof. Chen');
    expect(advisors).not.toContain('陈教授');
    expect(advisors).not.toContain('class="zh"');
    expect(advisors).not.toContain('Advisor bio');
    expect(html).not.toContain('Hidden Advisor');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('Wang Hui');
    expect(html).not.toContain('person--vacant');
    expect(html).toContain('<a class="section-link link-arrow" href="/people/advisors">');
    expect(html).toContain('href="/reviews"');
    expect(html).toContain('href="/people"');

    expect(html).not.toContain('class="gallery');

    expect(html).toContain(`class="hero__photo" src="${mediaUrl(PHOTO_KEY)}"`);
    expect(html).toContain(`<meta property="og:image" content="https://utmmsc.com${mediaUrl(PHOTO_KEY)}"/>`);
    expect(html).toContain('href="https://github.com/utmmsc" rel="noopener noreferrer" target="_blank"');
  });

  it('moves the old English home page to the root', async () => {
    const ctx = testExecutionContext();
    const response = await app.request('/en', {}, test.env, ctx);
    await ctx.settle();
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/');
  });

  it('offers the member network and the Android download, with the Chinese beneath', async () => {
    const html = await render('/');
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const section = main.slice(main.indexOf('aria-labelledby="home-member-app"'));
    expect(section).toContain('href="/UTMMSC/"');
    expect(section).toContain('Open the member network');
    expect(section).toContain('href="/download/android"');
    expect(section).toContain('Download the Android app');
    expect(section).toContain('Add to Home Screen');
    expect(section).toMatch(/<p class="pillar__text zh-text" lang="zh-CN">[^<]*添加到主屏幕/);
    expect(main.indexOf('home-member-app')).toBeLessThan(main.indexOf('home-pillars'));
  });

  it('groups sponsors, partners and partner clubs below the advisors and links the ones with a website', async () => {
    await seed();
    const partners = [
      { id: 'p-club', kind: 'club', name: { zh: '象棋社', en: 'Chess Club' }, logoKey: null, url: '' },
      { id: 'p-sponsor', kind: 'sponsor', name: { zh: '示例赞助商', en: '' }, logoKey: PHOTO_KEY, url: 'https://sponsor.example' },
      { id: 'p-sponsor-2', kind: 'sponsor', name: { zh: '第二赞助商', en: 'Second Sponsor' }, logoKey: null, url: '' },
    ];
    await test.d1.db.prepare("UPDATE settings SET value = ? WHERE key = 'site'").bind(JSON.stringify({ partners: { items: partners } })).run();

    const html = await render('/');
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const section = main.slice(main.indexOf('aria-labelledby="home-partners"'), main.indexOf('class="cta-band"'));
    expect(main.indexOf('home-advisors')).toBeGreaterThan(main.indexOf('home-reviews'));
    expect(main.indexOf('home-partners')).toBeGreaterThan(main.indexOf('home-advisors'));
    expect(main.indexOf('home-partners')).toBeLessThan(main.indexOf('class="cta-band"'));

    expect(occurrences(section, 'class="partner-group"')).toBe(2);
    expect(section).not.toContain('>Partners<span');
    expect(section).toContain('<h3 class="partner-group__title">Sponsors<span class="zh" lang="zh-CN">赞助商</span></h3>');
    expect(section).toContain('<h3 class="partner-group__title">Partner clubs<span class="zh" lang="zh-CN">联动社团</span></h3>');
    expect(section.indexOf('>Sponsors<')).toBeLessThan(section.indexOf('>Partner clubs<'));
    expect(section.indexOf('示例赞助商')).toBeLessThan(section.indexOf('Second Sponsor'));
    expect(section).toContain(
      `<a class="partner" href="https://sponsor.example" rel="noopener noreferrer" target="_blank"><span class="partner__logo"><img src="${mediaUrl(PHOTO_KEY)}" alt=""`,
    );
    expect(section).toContain('<span class="partner__name"><span lang="zh-CN">示例赞助商</span></span>');
    expect(section).toContain('<span class="partner__name">Second Sponsor<span class="zh" lang="zh-CN">第二赞助商</span></span>');
    expect(section).toContain('<div class="partner"><span class="partner__logo"><span class="partner__mark" aria-hidden="true">Chess Club</span></span>');
    expect(section).not.toContain('class="empty"');
  });

  it('shows editor text without English in Chinese with its lang, and only the English when there is no Chinese', async () => {
    await seed();
    test.d1.exec("UPDATE events SET title_en = '' WHERE id = 'evt-next'");
    await test.d1.db
      .prepare("UPDATE settings SET value = ? WHERE key = 'site'")
      .bind(JSON.stringify({ hero: { imageKey: PHOTO_KEY, tagline: { zh: '一起学习，一起成长', en: '' }, intro: { zh: '', en: 'A home for Mandarin learners.' } } }))
      .run();

    const html = await render('/');
    expect(html).toContain('<p class="hero__tagline" lang="zh-CN">一起学习，一起成长</p>');
    expect(html).not.toContain('hero__tagline zh-text');
    expect(html).toContain('<p lang="zh-CN">一起学习，一起成长</p>');
    expect(html).toContain('<div class="prose hero__intro"><p>A home for Mandarin learners.</p></div>');
    expect(html).not.toContain('hero__intro zh-text');
    expect(html).toContain('<h3 class="card__title"><a class="card__link" href="/events/2026-10-next-social"><span lang="zh-CN">近期联谊</span></a></h3>');
  });
});
