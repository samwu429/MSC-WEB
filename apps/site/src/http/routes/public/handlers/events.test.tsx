import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../../app';
import { createTestEnv, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';
import { TEST_INSTANT, seedEvent, seedEventPhoto, seedMedia } from '../../../../infrastructure/d1/public/testing/seed';

const COVER = 'img/2026/0123456789abcdef0123456789abcdef.jpg';
const PHOTO = 'img/2026/fedcba9876543210fedcba9876543210.jpg';

function occurrences(html: string, text: string): number {
  return html.split(text).length - 1;
}

describe.skipIf(!sqlite)('events pages', () => {
  let test: TestEnv;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TEST_INSTANT);
    test = createTestEnv();
  });

  afterEach(() => {
    test.close();
    vi.useRealTimers();
  });

  async function get(path: string): Promise<{ status: number; html: string }> {
    const response = await app.request(path, {}, test.env, testExecutionContext());
    return { status: response.status, html: await response.text() };
  }

  /** The upcoming and past sections of a list page, split at the past heading. */
  /** 列表页面的近期与往期两部分，以往期标题为分界。 */
  function sections(html: string): { upcoming: string; past: string } {
    const split = html.indexOf('id="past-events"');
    expect(split).toBeGreaterThan(0);
    return { upcoming: html.slice(0, split), past: html.slice(split) };
  }

  function seedTypicalEvents(): void {
    seedEvent(test.d1, { slug: 'mid-autumn-night', startsAt: '2026-11-05T18:30', title: { zh: '中秋晚会', en: 'Mid-Autumn Night' }, category: 'extracurricular' });
    seedEvent(test.d1, { slug: 'study-jam', startsAt: '2026-10-25T10:00', endsAt: '2026-10-25T15:00', title: { zh: '自习会', en: 'Study Jam' } });
    seedEvent(test.d1, { slug: 'welcome-week', startsAt: '2026-09-10T18:00', endsAt: '2026-09-10T21:00', title: { zh: '迎新周', en: 'Welcome Week' } });
    seedEvent(test.d1, { slug: 'secret-plan', startsAt: '2026-11-01T18:00', status: 'draft', title: { zh: '草稿活动', en: 'Draft event' } });
  }

  it('lists upcoming events earliest first and past events separately, in Chinese', async () => {
    seedTypicalEvents();
    const { status, html } = await get('/events');
    expect(status).toBe(200);
    expect(html).toContain('<html lang="zh-CN">');
    const { upcoming, past } = sections(html);
    expect(upcoming.indexOf('/events/study-jam')).toBeGreaterThan(0);
    expect(upcoming.indexOf('/events/study-jam')).toBeLessThan(upcoming.indexOf('/events/mid-autumn-night'));
    expect(upcoming).toContain('chip chip--ongoing');
    expect(upcoming).not.toContain('/events/welcome-week');
    expect(past).toContain('/events/welcome-week');
    expect(past).toContain('迎新周');
    expect(html).not.toContain('secret-plan');
    expect(html).not.toContain('草稿活动');
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).not.toMatch(/ style=|<script/);
  });

  it('renders the list in English under /en', async () => {
    seedTypicalEvents();
    const { status, html } = await get('/en/events');
    expect(status).toBe(200);
    expect(html).toContain('<html lang="en-CA">');
    expect(html).toContain('Upcoming events');
    expect(html).toContain('href="/en/events/mid-autumn-night"');
    expect(html).toContain('Mid-Autumn Night');
    expect(html).not.toContain('Draft event');
  });

  it('shows empty states when there are no events', async () => {
    const { html } = await get('/events');
    expect(html).toContain('暂时没有即将举行的活动');
    expect(html).toContain('还没有往期活动');
    expect(html).not.toContain('class="pager"');
  });

  it('pages through past events twelve at a time and keeps the category', async () => {
    for (let day = 1; day <= 14; day += 1) {
      const date = `2026-09-${String(day).padStart(2, '0')}`;
      seedEvent(test.d1, { slug: `talk-${day}`, startsAt: `${date}T18:00`, endsAt: `${date}T19:00` });
    }

    const first = sections((await get('/events')).html).past;
    expect(first.match(/class="card card--link"/g)).toHaveLength(12);
    expect(first).toContain('href="/events?page=2#past-events"');
    expect(first).toContain('第 1 页，共 2 页');
    expect(first.indexOf('/events/talk-14')).toBeLessThan(first.indexOf('/events/talk-13'));

    const second = sections((await get('/events?page=2')).html).past;
    expect(second.match(/class="card card--link"/g)).toHaveLength(2);
    expect(second).toContain('href="/events#past-events"');
    expect(second).not.toContain('page=3');

    const academic = (await get('/events?type=academic&page=2')).html;
    expect(academic).toContain('href="/events?type=academic#past-events"');

    for (const page of ['0', '-1', 'abc']) {
      const fallback = sections((await get(`/events?page=${page}`)).html).past;
      expect(fallback.match(/class="card card--link"/g), page).toHaveLength(12);
    }

    const beyond = sections((await get('/events?page=9')).html).past;
    expect(beyond).not.toContain('class="card card--link"');
    expect(beyond).toContain('这一页没有更多活动');
    expect(beyond).toContain('href="/events?page=2#past-events"');
  });

  it('filters by category and marks the active tab', async () => {
    seedTypicalEvents();
    const { html } = await get('/events?type=extracurricular');
    expect(html).toContain('<a class="tab" href="/events?type=extracurricular" aria-current="page">');
    expect(html).toContain('/events/mid-autumn-night');
    expect(html).not.toContain('/events/study-jam');
    expect(html).not.toContain('/events/welcome-week');
  });

  it('shows every category for an unknown type', async () => {
    seedTypicalEvents();
    const { status, html } = await get('/events?type=sports');
    expect(status).toBe(200);
    expect(html).toContain('<a class="tab" href="/events" aria-current="page">');
    expect(html).toContain('/events/mid-autumn-night');
    expect(html).toContain('/events/study-jam');
  });

  it('shows a published event with its cover, gallery and registration while it has not ended', async () => {
    await seedMedia(test.env.DB, test.media.bucket, COVER);
    await seedMedia(test.env.DB, test.media.bucket, PHOTO);
    const id = seedEvent(test.d1, {
      slug: 'mid-autumn-night',
      startsAt: '2026-11-05T18:30',
      endsAt: '2026-11-05T21:00',
      title: { zh: '中秋晚会', en: 'Mid-Autumn Night' },
      summary: { zh: '一起赏月、吃月饼。', en: 'Mooncakes under the full moon.' },
      body: { zh: '欢迎所有同学。\n\n详情见 https://example.com/info', en: '' },
      location: { zh: '学生中心', en: 'Student Centre' },
      coverKey: COVER,
      registrationUrl: 'https://forms.example.com/mid-autumn',
    });
    seedEventPhoto(test.d1, { eventId: id, mediaKey: PHOTO, caption: { zh: '去年的合影', en: 'Last year' } });

    const { status, html } = await get('/events/mid-autumn-night');
    expect(status).toBe(200);
    expect(html).toContain('<h1 class="page-hero__title" id="event-title">中秋晚会</h1>');
    expect(html).toContain('<meta name="description" content="一起赏月、吃月饼。"/>');
    expect(html).toContain(`<meta property="og:image" content="https://utmmsc.com/media/${COVER}"/>`);
    expect(html).toContain(`class="detail__cover" src="/media/${COVER}"`);
    expect(html).toContain('chip chip--upcoming');
    expect(html).toContain('学生中心');
    expect(html).toContain('href="https://example.com/info"');
    expect(html).toContain(`<a href="/media/${PHOTO}">`);
    expect(html).toContain('<figcaption>去年的合影</figcaption>');
    expect(html).toContain('href="https://forms.example.com/mid-autumn"');

    const english = (await get('/en/events/mid-autumn-night')).html;
    expect(english).toContain('Mid-Autumn Night');
    expect(english).toContain('<figcaption>Last year</figcaption>');
    expect(english).toContain('href="/en/events"');
    expect(english).toContain('欢迎所有同学。');
  });

  it('drops registration once an event has ended and describes it by its body when there is no summary', async () => {
    seedEvent(test.d1, {
      slug: 'welcome-week',
      startsAt: '2026-09-10T18:00',
      endsAt: '2026-09-10T21:00',
      body: { zh: '迎新周的完整介绍。', en: '' },
      registrationUrl: 'https://forms.example.com/welcome',
    });
    const { status, html } = await get('/events/welcome-week');
    expect(status).toBe(200);
    expect(html).toContain('chip chip--past');
    expect(html).not.toContain('https://forms.example.com/welcome');
    expect(html).toContain('<meta name="description" content="迎新周的完整介绍。"/>');
  });

  it('answers 404 for drafts, unknown slugs and malformed slugs', async () => {
    seedEvent(test.d1, { slug: 'secret-plan', startsAt: '2026-11-01T18:00', status: 'draft' });
    for (const path of ['/events/secret-plan', '/en/events/secret-plan', '/events/nothing-here', '/events/Not_A_Slug']) {
      const { status, html } = await get(path);
      expect(status, path).toBe(404);
      expect(html).toContain('noindex');
    }
  });

  it('escapes editor text in the list and on the detail page', async () => {
    seedEvent(test.d1, { slug: 'xss', startsAt: '2026-11-01T18:00', title: { zh: '<script>alert(1)</script>', en: '' }, summary: { zh: '<img src=x onerror=alert(1)>', en: '' } });
    for (const path of ['/events', '/events/xss']) {
      const { html } = await get(path);
      expect(html, path).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(html, path).not.toContain('<script>alert(1)</script>');
      expect(html, path).not.toContain('<img src=x');
    }
  });

  it('marks event text shown in the other language with its lang, on cards and on the event page', async () => {
    seedEvent(test.d1, {
      slug: 'mid-autumn-night',
      startsAt: '2026-11-05T18:30',
      title: { zh: '中秋晚会', en: '' },
      summary: { zh: '一起赏月。', en: '' },
      body: { zh: '欢迎所有同学。', en: '' },
      location: { zh: '学生中心', en: '' },
    });
    seedEvent(test.d1, { slug: 'study-jam', startsAt: '2026-11-06T10:00', title: { zh: '', en: 'Study Jam' }, location: { zh: '图书馆', en: 'Library' } });

    const list = (await get('/en/events')).html;
    expect(list).toContain('<h3 class="card__title" lang="zh-CN"><a class="card__link" href="/en/events/mid-autumn-night">中秋晚会</a></h3>');
    expect(list).toContain('<p class="card__text" lang="zh-CN">一起赏月。</p>');
    expect(occurrences(list, '<span class="meta__item" lang="zh-CN">')).toBe(1);
    expect(list).toContain('<h3 class="card__title"><a class="card__link" href="/en/events/study-jam">Study Jam</a></h3>');

    const chineseList = (await get('/events')).html;
    expect(chineseList).toContain('<h3 class="card__title" lang="en-CA"><a class="card__link" href="/events/study-jam">Study Jam</a></h3>');
    expect(chineseList).toContain('<h3 class="card__title"><a class="card__link" href="/events/mid-autumn-night">中秋晚会</a></h3>');

    const detail = (await get('/en/events/mid-autumn-night')).html;
    expect(detail).toContain('<h1 class="page-hero__title" id="event-title" lang="zh-CN">中秋晚会</h1>');
    expect(detail).toContain('<p class="lead page-hero__lead" lang="zh-CN">一起赏月。</p>');
    expect(detail).toContain('<div class="prose" lang="zh-CN"><p>欢迎所有同学。</p></div>');
    expect(detail).toContain('<span class="info-list__value" lang="zh-CN">学生中心</span>');

    const chineseDetail = (await get('/events/mid-autumn-night')).html;
    expect(chineseDetail).toContain('<h1 class="page-hero__title" id="event-title">中秋晚会</h1>');
    expect(chineseDetail).toContain('<span class="info-list__value">学生中心</span>');
  });
});
