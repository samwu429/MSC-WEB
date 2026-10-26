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

  it('lists upcoming events earliest first and past events separately, in English with the Chinese beneath', async () => {
    seedTypicalEvents();
    const { status, html } = await get('/events');
    expect(status).toBe(200);
    expect(html).toContain('<html lang="en-CA">');
    expect(html).toContain('Upcoming events<span class="zh" lang="zh-CN">近期活动</span>');
    const { upcoming, past } = sections(html);
    expect(upcoming.indexOf('/events/study-jam')).toBeGreaterThan(0);
    expect(upcoming.indexOf('/events/study-jam')).toBeLessThan(upcoming.indexOf('/events/mid-autumn-night'));
    expect(upcoming).toContain('chip chip--ongoing');
    expect(upcoming).not.toContain('/events/welcome-week');
    expect(upcoming).toContain('<a class="card__link" href="/events/mid-autumn-night">Mid-Autumn Night<span class="zh" lang="zh-CN">中秋晚会</span></a>');
    expect(past).toContain('/events/welcome-week');
    expect(past).toContain('Welcome Week<span class="zh" lang="zh-CN">迎新周</span>');
    expect(html).not.toContain('secret-plan');
    expect(html).not.toContain('Draft event');
    expect(html).not.toContain('href="/en');
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).not.toMatch(/ style=|<script/);
  });

  it('moves the old English list to the root and keeps the query', async () => {
    const response = await app.request('/en/events?type=academic', {}, test.env, testExecutionContext());
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('/events?type=academic');
  });

  it('shows empty states when there are no events', async () => {
    const { html } = await get('/events');
    expect(html).toContain('<strong>No upcoming events right now<span class="zh" lang="zh-CN">暂时没有即将举行的活动</span></strong>');
    expect(html).toContain('<strong>No past events yet<span class="zh" lang="zh-CN">还没有往期活动</span></strong>');
    expect(html).not.toContain('class="pager"');
  });

  it('pages through past events twelve at a time as a compact list and keeps the category', async () => {
    for (let day = 1; day <= 14; day += 1) {
      const date = `2026-09-${String(day).padStart(2, '0')}`;
      seedEvent(test.d1, { slug: `talk-${day}`, startsAt: `${date}T18:00`, endsAt: `${date}T19:00` });
    }

    const first = sections((await get('/events')).html).past;
    expect(first.match(/class="past-list__title"/g)).toHaveLength(12);
    expect(first).toContain('href="/events?page=2#past-events"');
    expect(first).toContain('Page 1 of 2');
    expect(first.indexOf('/events/talk-14')).toBeLessThan(first.indexOf('/events/talk-13'));

    const second = sections((await get('/events?page=2')).html).past;
    expect(second.match(/class="past-list__title"/g)).toHaveLength(2);
    expect(second).toContain('href="/events#past-events"');
    expect(second).not.toContain('page=3');

    const academic = (await get('/events?type=academic&page=2')).html;
    expect(academic).toContain('href="/events?type=academic#past-events"');

    for (const page of ['0', '-1', 'abc']) {
      const fallback = sections((await get(`/events?page=${page}`)).html).past;
      expect(fallback.match(/class="past-list__title"/g), page).toHaveLength(12);
    }

    const beyond = sections((await get('/events?page=9')).html).past;
    expect(beyond).not.toContain('class="past-list__title"');
    expect(beyond).toContain('There are no more events on this page<span class="zh" lang="zh-CN">这一页没有更多活动</span>');
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

  it('links the Code of Behaviour on the Academic tab and on academic event pages only', async () => {
    seedTypicalEvents();
    const academic = (await get('/events?type=academic')).html;
    expect(academic).toContain('Academic integrity<span class="zh" lang="zh-CN">学术诚信</span>');
    expect(academic).toContain('<a class="doc-link" href="/static/docs/code-of-behaviour-on-academic-matters.pdf" type="application/pdf" target="_blank" rel="noopener">');
    expect((await get('/events?type=extracurricular')).html).not.toContain('code-of-behaviour');
    expect((await get('/events')).html).not.toContain('code-of-behaviour');
    expect((await get('/events/study-jam')).html).toContain('<a class="doc-link" href="/static/docs/code-of-behaviour-on-academic-matters.pdf" type="application/pdf" target="_blank" rel="noopener">');
    expect((await get('/events/mid-autumn-night')).html).not.toContain('code-of-behaviour');
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
    expect(html).toContain('<h1 class="page-hero__title" id="event-title">Mid-Autumn Night<span class="zh" lang="zh-CN">中秋晚会</span></h1>');
    expect(html).toContain('<p class="lead page-hero__lead">Mooncakes under the full moon.</p><p class="lead page-hero__lead zh-text" lang="zh-CN">一起赏月、吃月饼。</p>');
    expect(html).toContain('<meta name="description" content="Mooncakes under the full moon."/>');
    expect(html).toContain(`<meta property="og:image" content="https://utmmsc.com/media/${COVER}"/>`);
    expect(html).toContain(`class="detail__cover" src="/media/${COVER}"`);
    expect(html).toContain('chip chip--upcoming');
    expect(html).toContain('Student Centre');
    // The body has no English, so it shows in Chinese once, marked as Chinese.
    // 正文没有英文，因此只以中文显示一次，并标记为中文。
    expect(html).toContain('<div class="prose" lang="zh-CN"><p>欢迎所有同学。</p>');
    expect(html).not.toContain('prose zh-text');
    expect(html).toContain('href="https://example.com/info"');
    expect(html).toContain(`<a href="/media/${PHOTO}">`);
    expect(html).toContain('<figcaption>Last year</figcaption>');
    expect(html).toContain('href="https://forms.example.com/mid-autumn"');
    expect(html).toContain('<a class="backlink" href="/events">');

    const old = await app.request('/en/events/mid-autumn-night', {}, test.env, testExecutionContext());
    expect(old.status).toBe(301);
    expect(old.headers.get('location')).toBe('/events/mid-autumn-night');
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

  it('lists an event marked as ended among past events and stops its sign-ups, whatever its date', async () => {
    seedEvent(test.d1, { slug: 'next-week', startsAt: '2026-11-01T18:00' });
    seedEvent(test.d1, { slug: 'called-off', startsAt: '2026-11-08T18:00', registrationUrl: 'https://forms.example.com/called-off' });
    test.d1.exec("UPDATE events SET archived = 1 WHERE slug = 'called-off'");

    const { upcoming, past } = sections((await get('/events')).html);
    expect(upcoming).toContain('/events/next-week');
    expect(upcoming).not.toContain('/events/called-off');
    expect(past).toContain('<ul class="past-list">');
    expect(past).toContain('<a class="past-list__title" href="/events/called-off">');

    const detail = (await get('/events/called-off')).html;
    expect(detail).toContain('chip chip--past');
    expect(detail).not.toContain('https://forms.example.com/called-off');
  });

  it('answers 404 for drafts, unknown slugs and malformed slugs', async () => {
    seedEvent(test.d1, { slug: 'secret-plan', startsAt: '2026-11-01T18:00', status: 'draft' });
    for (const path of ['/events/secret-plan', '/events/nothing-here', '/events/Not_A_Slug']) {
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

  it('shows event text without English in Chinese with its lang, on cards and on the event page', async () => {
    seedEvent(test.d1, {
      slug: 'mid-autumn-night',
      startsAt: '2026-11-05T18:30',
      title: { zh: '中秋晚会', en: '' },
      summary: { zh: '一起赏月。', en: '' },
      body: { zh: '欢迎所有同学。', en: '' },
      location: { zh: '学生中心', en: '' },
    });
    seedEvent(test.d1, { slug: 'study-jam', startsAt: '2026-11-06T10:00', title: { zh: '', en: 'Study Jam' }, location: { zh: '图书馆', en: 'Library' } });

    const list = (await get('/events')).html;
    expect(list).toContain('<h3 class="card__title"><a class="card__link" href="/events/mid-autumn-night"><span lang="zh-CN">中秋晚会</span></a></h3>');
    expect(list).toContain('<p class="card__text" lang="zh-CN">一起赏月。</p>');
    expect(list).not.toContain('card__text zh-text');
    expect(occurrences(list, '<span class="meta__item" lang="zh-CN">')).toBe(1);
    // English with no Chinese shows the English alone.
    // 只有英文时只显示英文。
    expect(list).toContain('<h3 class="card__title"><a class="card__link" href="/events/study-jam">Study Jam</a></h3>');

    const detail = (await get('/events/mid-autumn-night')).html;
    expect(detail).toContain('<h1 class="page-hero__title" id="event-title"><span lang="zh-CN">中秋晚会</span></h1>');
    expect(detail).toContain('<p class="lead page-hero__lead" lang="zh-CN">一起赏月。</p>');
    expect(detail).toContain('<div class="prose" lang="zh-CN"><p>欢迎所有同学。</p></div>');
    expect(detail).toContain('<span class="info-list__value" lang="zh-CN">学生中心</span>');
  });
});
