import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../../app';
import { createTestEnv, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';
import { TEST_INSTANT, seedCourse, seedEvent, seedSession } from '../../../../infrastructure/d1/public/testing/seed';

const CODE_OF_BEHAVIOUR_LINK = '<a class="doc-link" href="/static/docs/code-of-behaviour-on-academic-matters.pdf" type="application/pdf" target="_blank" rel="noopener">';

function occurrences(html: string, text: string): number {
  return html.split(text).length - 1;
}

/** The page content between the header and the footer, so header and footer links do not count. */
/** 页眉与页脚之间的页面内容，页眉与页脚中的链接因此不会被计入。 */
function mainOf(html: string): string {
  return html.slice(html.indexOf('<main'), html.indexOf('</main>'));
}

/** The part of a page from one heading id up to the next section, or to the end of the page content. */
/** 页面中从某个标题 id 开始，到下一个板块或页面内容结束为止的部分。 */
function sectionOf(html: string, id: string): string {
  const main = mainOf(html);
  const start = main.indexOf(`id="${id}"`);
  expect(start, id).toBeGreaterThan(0);
  const end = main.indexOf('<section', start);
  return main.slice(start, end === -1 ? undefined : end);
}

function slugsIn(html: string): string[] {
  return [...html.matchAll(/href="\/events\/([^"#?]+)"/g)].map((match) => match[1] ?? '');
}

describe.skipIf(!sqlite)('Academic Activities pages', () => {
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

  async function render(path: string): Promise<string> {
    const ctx = testExecutionContext();
    const response = await app.request(path, {}, test.env, ctx);
    await ctx.settle();
    expect(response.status, path).toBe(200);
    const html = await response.text();
    expect(html, path).not.toMatch(/<script|\sstyle=/);
    expect(html.match(/<h1[ >]/g), path).toHaveLength(1);
    return html;
  }

  /**
   * Interest classes beside everything that must stay off their lists: a draft, one marked as ended before its date,
   * an extracurricular event carrying the mark, and an ordinary academic event. Now is noon on 25 October 2026.
   * 兴趣课，以及所有不应出现在兴趣课列表中的活动：草稿、在日期之前就被标记为已结束的兴趣课、带有标记的课外活动，以及普通的学术活动。
   * 现在为 2026 年 10 月 25 日中午。
   */
  function seedInterestClasses(): void {
    seedEvent(test.d1, { slug: 'why-prices-rise', startsAt: '2026-11-27T18:00', title: { zh: '物价为什么会上涨', en: 'Why Prices Rise' }, interestClass: true });
    seedEvent(test.d1, { slug: 'how-computers-read-chinese', startsAt: '2026-10-30T18:00', title: { zh: '计算机如何读懂中文', en: 'How Computers Read Chinese' }, interestClass: true });
    seedEvent(test.d1, { slug: 'game-theory', startsAt: '2026-11-13T18:00', interestClass: true });
    seedEvent(test.d1, { slug: 'black-holes', startsAt: '2026-12-04T18:00', interestClass: true });
    seedEvent(test.d1, { slug: 'tea-history', startsAt: '2026-10-02T18:00', endsAt: '2026-10-02T19:30', title: { zh: '茶的历史', en: 'A History of Tea' }, interestClass: true });
    seedEvent(test.d1, { slug: 'called-off-class', startsAt: '2026-11-06T18:00', interestClass: true, archived: true });
    seedEvent(test.d1, { slug: 'draft-class', startsAt: '2026-11-01T18:00', interestClass: true, status: 'draft' });
    seedEvent(test.d1, { slug: 'mislabelled-social', startsAt: '2026-10-28T18:00', category: 'extracurricular', interestClass: true });
    seedEvent(test.d1, { slug: 'writing-workshop', startsAt: '2026-10-27T18:00', category: 'academic' });
  }

  describe('/academics', () => {
    it('shows test reviews, interest classes and the way to talks and workshops under the integrity notice, with empty states on an empty database', async () => {
      const html = await render('/academics');
      expect(html).toContain('<title>Academic Activities · UTMMSC Mandarin Scholars Coalition 国语学者联盟</title>');
      expect(html).toContain(
        '<meta name="description" content="The Academic Department runs test reviews for specific courses before midterms and finals, interest classes in Mandarin on topics beyond any one course, and academic talks and workshops."/>',
      );
      const main = mainOf(html);
      expect(main).toContain('<div class="eyebrow">Academic Department</div>');
      expect(main).toContain('<h1 class="page-hero__title">Academic Activities<span class="zh" lang="zh-CN">学术活动</span></h1>');
      expect(main).toContain(
        '<p class="page-hero__lead zh-text" lang="zh-CN">学术部在期中、期末前开设针对具体课程的考前复习，用中文开设不局限于任何一门课程的兴趣课，并举办学术讲座与工作坊。</p>',
      );
      expect(main).not.toContain('two kinds');
      expect(main).toContain('<strong>Academic integrity<span class="zh" lang="zh-CN">学术诚信</span></strong>');
      expect(main).toContain(CODE_OF_BEHAVIOUR_LINK);

      const reviews = sectionOf(html, 'academic-reviews');
      expect(main.indexOf('id="academic-reviews"')).toBeLessThan(main.indexOf('id="academic-interest-classes"'));
      expect(main).toContain('<div class="eyebrow">Fall 2026</div><h2 class="section-title" id="academic-reviews">Test Reviews<span class="zh" lang="zh-CN">考前复习</span></h2>');
      expect(reviews).toContain('Midterm and final reviews for specific courses, led by students who know the material.');
      expect(reviews).toContain('期中、期末前针对具体课程的复习，由熟悉课程的同学主讲。');
      expect(reviews).toContain('<a class="section-link link-arrow" href="/reviews">All test reviews');
      expect(reviews).toContain('<strong>No reviews have been published for this term yet<span class="zh" lang="zh-CN">这个学期还没有发布复习</span></strong>');

      const classes = sectionOf(html, 'academic-interest-classes');
      expect(classes).toContain('Interest Classes<span class="zh" lang="zh-CN">兴趣课</span></h2>');
      expect(classes).toContain('Talks in Mandarin on topics many students are curious about, outside any course.');
      expect(classes).toContain('用中文讲授大家感兴趣的知识，不跟随任何课程。');
      expect(classes).toContain('<a class="section-link link-arrow" href="/interest-classes">All interest classes');
      expect(classes).toContain(
        '<strong>The first interest classes are coming soon<span class="zh" lang="zh-CN">第一批兴趣课即将推出</span></strong><span>Topics and times will be posted here.<span class="zh" lang="zh-CN">话题与时间确定后会在这里公布。</span></span>',
      );

      const talks = sectionOf(html, 'academic-talks');
      expect(main.indexOf('id="academic-interest-classes"')).toBeLessThan(main.indexOf('id="academic-talks"'));
      expect(talks).toContain('Talks and workshops<span class="zh" lang="zh-CN">讲座与工作坊</span></h2>');
      expect(talks).toContain('The Academic Department&#39;s talks and workshops are listed on the Events page with the rest of our activities.');
      expect(talks).toContain('学术部的讲座与工作坊与其他活动一起列在活动页面。');
      expect(talks).toContain('<a class="section-link link-arrow" href="/events?type=academic">Browse academic events');
    });

    it("shows this term's test reviews and at most the next three published academic interest classes", async () => {
      const csc = seedCourse(test.d1, { code: 'CSC108H5', title: { zh: '计算机编程导论', en: 'Introduction to Computer Programming' } });
      seedSession(test.d1, { courseId: csc, term: '2026-fall', startsAt: '2026-10-30T18:00' });
      seedSession(test.d1, { courseId: seedCourse(test.d1, { code: 'MAT135H5' }), term: '2026-winter' });
      seedInterestClasses();

      const html = await render('/academics');
      const reviews = sectionOf(html, 'academic-reviews');
      expect(reviews).toContain('<a class="course__code" href="/reviews/csc108h5">CSC108H5</a>');
      expect(reviews).not.toContain('MAT135H5');
      expect(reviews).not.toContain('class="empty"');

      const classes = sectionOf(html, 'academic-interest-classes');
      expect(slugsIn(classes)).toEqual(['how-computers-read-chinese', 'game-theory', 'why-prices-rise']);
      expect(occurrences(classes, '<span class="chip chip--interest">Interest Class</span>')).toBe(3);
      expect(classes).not.toContain('class="empty"');
    });

    it('says none are coming up right now once an interest class has been held', async () => {
      seedEvent(test.d1, { slug: 'tea-history', startsAt: '2026-10-02T18:00', interestClass: true });
      const classes = sectionOf(await render('/academics'), 'academic-interest-classes');
      expect(classes).toContain('<strong>No upcoming interest classes right now<span class="zh" lang="zh-CN">暂时没有即将开始的兴趣课</span></strong>');
      expect(classes).not.toContain('The first interest classes');
      expect(classes).not.toContain('/events/tea-history');
    });
  });

  describe('/interest-classes', () => {
    it('explains interest classes, links Test Reviews and the Code, and says the first classes are coming on an empty database', async () => {
      const html = await render('/interest-classes');
      expect(html).toContain('<title>Interest Classes · UTMMSC Mandarin Scholars Coalition 国语学者联盟</title>');
      expect(html).toContain(
        '<meta name="description" content="Talks in Mandarin on things many of us are curious about, from economics to computer science and beyond. Each class stands on its own, so you can come to any of them."/>',
      );
      const main = mainOf(html);
      expect(main).toContain('<div class="eyebrow">Academic Department</div>');
      expect(main).toContain('<h1 class="page-hero__title">Interest Classes<span class="zh" lang="zh-CN">兴趣课</span></h1>');
      expect(main).toContain('<p class="page-hero__lead zh-text" lang="zh-CN">用中文聊聊大家感兴趣的知识，从经济学、计算机到更多领域，话题不设限。每节课独立成篇，想听哪节就来哪节。</p>');
      expect(main).toContain('<strong>Not tied to any course<span class="zh" lang="zh-CN">不跟随课程</span></strong>');
      expect(main).toContain(
        '<p>Interest classes don&#39;t follow any course and aren&#39;t tutoring. A topic may overlap with something you study, but no class works through graded assignments, quizzes or exams.</p>',
      );
      expect(main).toContain('<p class="zh-text" lang="zh-CN">兴趣课不跟随任何课程，也不是课程辅导。话题可能与你所学的内容有所重合，但课上从不讲解计入成绩的作业、测验或考试。</p>');
      expect(main).toMatch(
        /<a class="doc-link" href="\/reviews"><svg[^]*?<\/svg><span>For help with a specific course before a test, see Test Reviews<span class="zh" lang="zh-CN">考前需要针对具体课程的复习，请看考前复习<\/span><\/span><\/a>/,
      );
      expect(occurrences(main, 'see Test Reviews')).toBe(1);
      expect(main).toContain(CODE_OF_BEHAVIOUR_LINK);

      expect(main).toContain('<h2 class="section-title" id="upcoming-classes">Upcoming classes<span class="zh" lang="zh-CN">近期兴趣课</span></h2>');
      expect(main).toContain('<strong>The first interest classes are coming soon<span class="zh" lang="zh-CN">第一批兴趣课即将推出</span></strong>');
      expect(main).not.toContain('id="past-classes"');
      expect(main).not.toContain('class="pager"');
    });

    it('lists only published academic interest classes: upcoming as cards, past ones compactly', async () => {
      seedInterestClasses();
      const html = await render('/interest-classes');
      const upcoming = sectionOf(html, 'upcoming-classes');
      expect(slugsIn(upcoming)).toEqual(['how-computers-read-chinese', 'game-theory', 'why-prices-rise', 'black-holes']);
      expect(upcoming).toContain('<a class="card__link" href="/events/why-prices-rise">Why Prices Rise<span class="zh" lang="zh-CN">物价为什么会上涨</span></a>');
      expect(occurrences(upcoming, '<span class="chip chip--interest">Interest Class</span>')).toBe(4);
      expect(upcoming).not.toContain('class="empty"');

      expect(mainOf(html)).toContain('<h2 class="section-title" id="past-classes">Past classes<span class="zh" lang="zh-CN">往期兴趣课</span></h2>');
      const past = sectionOf(html, 'past-classes');
      expect(slugsIn(past)).toEqual(['called-off-class', 'tea-history']);
      expect(past).toContain('<a class="past-list__title" href="/events/tea-history">A History of Tea<span class="zh" lang="zh-CN">茶的历史</span></a>');
      expect(past).not.toContain('past-list__tag');

      for (const slug of ['draft-class', 'mislabelled-social', 'writing-workshop']) expect(mainOf(html), slug).not.toContain(`/events/${slug}`);
    });

    it('says none are coming up right now once a class has been held', async () => {
      seedEvent(test.d1, { slug: 'tea-history', startsAt: '2026-10-02T18:00', interestClass: true });
      const html = await render('/interest-classes');
      expect(sectionOf(html, 'upcoming-classes')).toContain(
        '<strong>No upcoming interest classes right now<span class="zh" lang="zh-CN">暂时没有即将开始的兴趣课</span></strong>',
      );
      expect(slugsIn(sectionOf(html, 'past-classes'))).toEqual(['tea-history']);
    });

    it('pages through past classes twelve at a time', async () => {
      for (let day = 1; day <= 14; day += 1) {
        const date = `2026-09-${String(day).padStart(2, '0')}`;
        seedEvent(test.d1, { slug: `class-${day}`, startsAt: `${date}T18:00`, endsAt: `${date}T19:30`, interestClass: true });
      }

      const first = sectionOf(await render('/interest-classes'), 'past-classes');
      expect(first.match(/class="past-list__title"/g)).toHaveLength(12);
      expect(first.indexOf('/events/class-14')).toBeLessThan(first.indexOf('/events/class-13'));
      expect(first).toContain('<nav class="pager" aria-label="Past class pages">');
      expect(first).toContain('href="/interest-classes?page=2#past-classes"');
      expect(first).toContain('Page 1 of 2');

      const second = sectionOf(await render('/interest-classes?page=2'), 'past-classes');
      expect(second.match(/class="past-list__title"/g)).toHaveLength(2);
      expect(second).toContain('href="/interest-classes#past-classes"');

      const beyond = sectionOf(await render('/interest-classes?page=9'), 'past-classes');
      expect(beyond).not.toContain('class="past-list__title"');
      expect(beyond).toContain('There are no more classes on this page<span class="zh" lang="zh-CN">这一页没有更多兴趣课</span>');
      expect(beyond).toContain('href="/interest-classes?page=2#past-classes"');

      const fallback = sectionOf(await render('/interest-classes?page=abc'), 'past-classes');
      expect(fallback.match(/class="past-list__title"/g)).toHaveLength(12);
    });

    it('moves the old English address to the root', async () => {
      const response = await app.request('/en/interest-classes?page=2', {}, test.env, testExecutionContext());
      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toBe('/interest-classes?page=2');
    });
  });

  describe('navigation', () => {
    const PARENT = '<a class="site-nav__link site-nav__link--parent" href="/academics"';

    /** The desktop dropdown links of Academic Activities, with their marks. */
    /** "学术活动" 桌面下拉菜单中的链接及其标记。 */
    function dropdownOf(html: string): string {
      const start = html.indexOf(PARENT);
      return html.slice(start, html.indexOf('</div></div></div>', start));
    }

    it('replaces Test Reviews with Academic Activities, whose dropdown lists Test Reviews then Interest Classes in both languages', async () => {
      const html = await render('/');
      expect(html).not.toContain('<a class="site-nav__link" href="/reviews">');
      expect(html).toContain(`${PARENT}><span class="site-nav__label">Academic Activities<span class="zh" lang="zh-CN">学术活动</span></span>`);
      expect(dropdownOf(html)).toContain(
        '<div class="site-nav__panel"><a class="site-nav__menu-link" href="/reviews">Test Reviews<span class="zh" lang="zh-CN">考前复习</span></a><a class="site-nav__menu-link" href="/interest-classes">Interest Classes<span class="zh" lang="zh-CN">兴趣课</span></a>',
      );
      const phone = html.slice(html.indexOf('<details class="mobile-nav">'));
      expect(phone).toContain(
        '<a href="/academics">Academic Activities<span class="zh" lang="zh-CN">学术活动</span></a><div class="mobile-nav__sub"><a href="/reviews">Test Reviews<span class="zh" lang="zh-CN">考前复习</span></a><a href="/interest-classes">Interest Classes<span class="zh" lang="zh-CN">兴趣课</span></a></div>',
      );
    });

    it.each([
      { path: '/academics', parent: 'page', reviews: null, classes: null },
      { path: '/reviews', parent: 'true', reviews: 'page', classes: null },
      { path: '/reviews/csc108h5', parent: 'true', reviews: 'true', classes: null },
      { path: '/interest-classes', parent: 'true', reviews: null, classes: 'page' },
    ])('marks $path in the bar and in the phone menu', async ({ path, parent, reviews, classes }) => {
      seedSession(test.d1, { courseId: seedCourse(test.d1, { code: 'CSC108H5' }), term: '2026-fall' });
      const html = await render(path);
      const mark = (current: string | null) => (current ? ` aria-current="${current}"` : '');
      expect(html).toContain(`${PARENT}${mark(parent)}>`);
      const dropdown = dropdownOf(html);
      expect(dropdown).toContain(`<a class="site-nav__menu-link" href="/reviews"${mark(reviews)}>`);
      expect(dropdown).toContain(`<a class="site-nav__menu-link" href="/interest-classes"${mark(classes)}>`);
      const phone = html.slice(html.indexOf('<details class="mobile-nav">'));
      expect(phone).toContain(`<a href="/academics"${mark(parent)}>`);
      expect(phone).toContain(`<a href="/reviews"${mark(reviews)}>`);
      expect(phone).toContain(`<a href="/interest-classes"${mark(classes)}>`);
      expect(html).not.toContain('<a class="site-nav__link" href="/events" aria-current');
    });
  });
});
