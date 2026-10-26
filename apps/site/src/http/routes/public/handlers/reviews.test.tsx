import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../../app';
import { createTestEnv, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';
import { TEST_INSTANT, seedCourse, seedMaterial, seedMedia, seedSession } from '../../../../infrastructure/d1/public/testing/seed';

const SLIDES = 'doc/2026/0123456789abcdef0123456789abcdef.pdf';

describe.skipIf(!sqlite)('test review pages', () => {
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

  async function get(path: string): Promise<Response> {
    return app.request(path, {}, test.env, testExecutionContext());
  }

  async function html(path: string): Promise<string> {
    const response = await get(path);
    expect(response.status, path).toBe(200);
    return response.text();
  }

  function locationOf(response: Response): string {
    const location = new URL(response.headers.get('location') ?? '', 'https://utmmsc.com');
    return `${location.pathname}${location.search}`;
  }

  /** CSC108H5 has fall and winter sessions, MAT135H5 only winter ones, and ECO101H5 is hidden. */
  /** CSC108H5 有秋季与冬季场次，MAT135H5 只有冬季场次，ECO101H5 已隐藏。 */
  function seedCourses(): { csc: string; upcoming: string; past: string } {
    const csc = seedCourse(test.d1, { code: 'CSC108H5', title: { zh: '计算机编程导论', en: 'Introduction to Computer Programming' } });
    const mat = seedCourse(test.d1, { code: 'MAT135H5', title: { zh: '微积分 I', en: 'Calculus I' } });
    const eco = seedCourse(test.d1, { code: 'ECO101H5', visible: false });
    const upcoming = seedSession(test.d1, {
      courseId: csc,
      term: '2026-fall',
      startsAt: '2026-10-30T18:00',
      endsAt: '2026-10-30T20:00',
      title: { zh: '第 1-5 章', en: 'Chapters 1-5' },
      location: { zh: 'IB 110', en: 'IB 110' },
      presenters: 'Alex Chen',
      registrationUrl: 'https://forms.example.com/csc108-midterm',
      notes: { zh: '请自带电脑。', en: 'Bring a laptop.' },
    });
    const past = seedSession(test.d1, {
      courseId: csc,
      term: '2026-winter',
      exam: 'final',
      startsAt: '2026-04-10T18:00',
      registrationUrl: 'https://forms.example.com/csc108-final',
      recordingUrl: 'https://video.example.com/csc108-final',
    });
    seedSession(test.d1, { courseId: csc, term: '2026-fall', exam: 'final', status: 'draft', title: { zh: '草稿场次', en: 'Draft session' } });
    seedSession(test.d1, { courseId: mat, term: '2026-winter', mode: 'online' });
    seedSession(test.d1, { courseId: eco, term: '2025-fall' });
    return { csc, upcoming, past };
  }

  it('shows the current term by default with the integrity notice and every reviewed course', async () => {
    seedCourses();
    const page = await html('/reviews');
    expect(page).toContain('<html lang="en-CA">');
    expect(page).toContain('<a class="tab" href="/reviews" aria-current="page">Fall 2026</a>');
    expect(page).toContain('<a class="tab" href="/reviews?term=2026-winter">Winter 2026</a>');
    expect(page).not.toContain('Fall 2025');
    expect(page).toContain('<h2 class="section-title" id="term-reviews">Fall 2026<span class="zh" lang="zh-CN">2026 秋季学期</span></h2>');
    expect(page).toContain('notice notice--integrity');
    expect(page).toContain('<strong>Academic integrity<span class="zh" lang="zh-CN">学术诚信</span></strong>');
    expect(page).toContain('(Constitution, Article 2.3)');
    expect(page).toContain('（章程第 2.3 条）');
    expect(page).toContain('<a class="course__code" href="/reviews/csc108h5">CSC108H5</a>');
    expect(page).toContain('<p class="course__title">Introduction to Computer Programming<span class="zh" lang="zh-CN">计算机编程导论</span></p>');
    expect(page).not.toContain('<a class="course__code" href="/reviews/mat135h5">');
    expect(page).toContain('<a class="doc-item__title" href="/reviews/mat135h5">MAT135H5</a>');
    expect(page).not.toContain('ECO101H5');
    expect(page).not.toContain('Draft session');
    expect(page).not.toContain('草稿场次');
    expect(page).toContain('Midterm Review · Chapters 1-5');
    expect(page).toContain('href="https://forms.example.com/csc108-midterm"');
    expect(page.match(/<h1[ >]/g)).toHaveLength(1);
    expect(page).not.toMatch(/ style=|<script/);
  });

  it('moves a course marked as ended out of the term into a compact list at the bottom, and its page stops sign-ups', async () => {
    seedCourses();
    test.d1.exec("UPDATE courses SET archived = 1 WHERE code = 'CSC108H5'");

    const page = await html('/reviews');
    const term = page.slice(page.indexOf('id="term-reviews"'), page.indexOf('id="all-courses"'));
    expect(term).not.toContain('CSC108H5');
    const all = page.slice(page.indexOf('id="all-courses"'), page.indexOf('id="ended-courses"'));
    expect(all).toContain('MAT135H5');
    expect(all).not.toContain('CSC108H5');
    const ended = page.slice(page.indexOf('id="ended-courses"'));
    expect(ended).toContain('Ended courses<span class="zh" lang="zh-CN">已结束的课程</span>');
    expect(ended).toContain('<a href="/reviews/csc108h5"><span class="ended-list__code">CSC108H5</span>');

    const course = await html('/reviews/csc108h5');
    expect(course).toContain('Reviews for this course have ended');
    expect(course).not.toContain('https://forms.example.com/csc108-midterm');
    expect(course).toContain('https://video.example.com/csc108-final');
  });

  it('leaves out the ended courses list while every course is running', async () => {
    seedCourses();
    expect(await html('/reviews')).not.toContain('id="ended-courses"');
  });

  it('shows an explicitly requested term', async () => {
    seedCourses();
    const page = await html('/reviews?term=2026-winter');
    expect(page).toContain('<a class="tab" href="/reviews?term=2026-winter" aria-current="page">Winter 2026</a>');
    expect(page).toContain('<a class="course__code" href="/reviews/mat135h5">MAT135H5</a>');
    expect(page).toContain('href="https://video.example.com/csc108-final"');
    expect(page).not.toContain('href="https://forms.example.com/csc108-final"');
  });

  it('falls back to the current term for malformed or unlisted terms', async () => {
    seedCourses();
    for (const term of ['nonsense', '2026-spring', '2025-fall', '2019-winter']) {
      const page = await html(`/reviews?term=${term}`);
      expect(page, term).toContain('<a class="tab" href="/reviews" aria-current="page">Fall 2026</a>');
      expect(page, term).toContain('<a class="course__code" href="/reviews/csc108h5">');
    }
  });

  it('always offers the current term, with an empty state when it has no reviews', async () => {
    seedSession(test.d1, { courseId: seedCourse(test.d1, { code: 'MAT135H5' }), term: '2026-winter' });
    const page = await html('/reviews');
    expect(page).toContain('<a class="tab" href="/reviews" aria-current="page">Fall 2026</a>');
    expect(page).toContain('<strong>No reviews have been published for this term yet<span class="zh" lang="zh-CN">这个学期还没有发布复习</span></strong>');
    expect(page).toContain('href="/reviews/mat135h5"');
  });

  it('sends the old English addresses to the same pages at the root', async () => {
    seedCourses();
    const moves = [
      ['/en/reviews', '/reviews'],
      ['/en/reviews?term=2026-winter', '/reviews?term=2026-winter'],
      ['/en/reviews/csc108h5', '/reviews/csc108h5'],
    ] as const;
    for (const [from, to] of moves) {
      const response = await get(from);
      expect(response.status, from).toBe(301);
      expect(locationOf(response), from).toBe(to);
    }
  });

  it('links a course card to the materials of each session on the course page', async () => {
    const { upcoming } = seedCourses();
    await seedMedia(test.env.DB, test.media.bucket, SLIDES);
    seedMaterial(test.d1, { sessionId: upcoming, mediaKey: SLIDES });
    seedMaterial(test.d1, { sessionId: upcoming, url: 'https://drive.example.com/practice', kind: 'practice' });
    const page = await html('/reviews');
    expect(page).toContain(`href="/reviews/csc108h5#session-${upcoming}"`);
    expect(page).toContain('Materials (2)');
  });

  it('shows a course page by lowercase code with sessions grouped by term and materials linked', async () => {
    const { upcoming, past } = seedCourses();
    await seedMedia(test.env.DB, test.media.bucket, SLIDES);
    seedMaterial(test.d1, { sessionId: upcoming, mediaKey: SLIDES, sortOrder: 1 });
    seedMaterial(test.d1, { sessionId: upcoming, url: 'https://drive.example.com/practice', kind: 'practice', label: { zh: '模拟题', en: 'Mock exam' }, sortOrder: 2 });

    const page = await html('/reviews/csc108h5');
    expect(page).toContain('<h1 class="page-hero__title">CSC108H5</h1>');
    expect(page).toContain('<p class="page-hero__lead"><strong>Introduction to Computer Programming<span class="zh" lang="zh-CN">计算机编程导论</span></strong></p>');
    expect(page).toContain('<a class="backlink" href="/reviews">');
    expect(page.indexOf('id="term-2026-fall"')).toBeLessThan(page.indexOf('id="term-2026-winter"'));
    expect(page).toContain(`id="session-${upcoming}"`);
    expect(page).toContain(`<a class="material" href="/media/${SLIDES}" type="application/pdf">`);
    expect(page).toContain('Slides</a>');
    expect(page).toContain('<a class="material" href="https://drive.example.com/practice" target="_blank" rel="noopener noreferrer">');
    expect(page).toContain('Mock exam</a>');
    expect(page).toContain('Presenters: Alex Chen');
    expect(page).toContain('<div class="prose"><p>Bring a laptop.</p></div><div class="prose zh-text" lang="zh-CN"><p>请自带电脑。</p></div>');
    expect(page).toContain('href="https://forms.example.com/csc108-midterm"');
    expect(page).toContain(`id="session-${past}"`);
    expect(page).toContain('href="https://video.example.com/csc108-final"');
    expect(page).not.toContain('href="https://forms.example.com/csc108-final"');
    expect(page).not.toContain('Draft session');
  });

  it('shows a visible course without published sessions with an empty state', async () => {
    seedCourse(test.d1, { code: 'PSY100H5' });
    const page = await html('/reviews/psy100h5');
    expect(page).toContain('No reviews have been published for this course yet<span class="zh" lang="zh-CN">这门课程暂时没有已发布的复习</span>');
  });

  it('redirects other casings of a course code to the lowercase address', async () => {
    seedCourses();
    const upper = await get('/reviews/CSC108H5');
    expect(upper.status).toBe(301);
    expect(locationOf(upper)).toBe('/reviews/csc108h5');

    // An old English address moves to the root first, then to the lowercase code.
    // 旧的英文地址先移到根路径，再移到小写课程代码。
    const legacy = await get('/en/reviews/Csc108h5');
    expect(legacy.status).toBe(301);
    expect(locationOf(legacy)).toBe('/reviews/Csc108h5');
    const mixed = await get(locationOf(legacy));
    expect(mixed.status).toBe(301);
    expect(locationOf(mixed)).toBe('/reviews/csc108h5');
  });

  it('answers 404 for hidden, unknown and malformed courses', async () => {
    seedCourses();
    for (const path of ['/reviews/eco101h5', '/reviews/csc999h5', '/reviews/not-a-course', '/reviews/%3Cscript%3E']) {
      const response = await get(path);
      expect(response.status, path).toBe(404);
    }
  });

  it('escapes course and session text', async () => {
    const course = seedCourse(test.d1, { code: 'CSC108H5', title: { zh: '<script>alert(1)</script>', en: '' } });
    seedSession(test.d1, { courseId: course, term: '2026-fall', notes: { zh: '<b onmouseover=alert(1)>hi</b>', en: '' } });
    for (const path of ['/reviews', '/reviews/csc108h5']) {
      const page = await html(path);
      expect(page, path).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(page, path).not.toContain('<script>alert(1)</script>');
      expect(page, path).not.toContain('<b onmouseover');
    }
  });

  it('says "this term" only for the current term, in English with the Chinese beneath', async () => {
    seedCourses();
    const lead = '<p class="section-lead">Courses with reviews scheduled this term.</p><p class="section-lead zh-text" lang="zh-CN">本学期已安排复习的课程。</p>';
    const other = '<p class="section-lead">Courses with reviews in the selected term.</p><p class="section-lead zh-text" lang="zh-CN">所选学期开设复习的课程。</p>';
    const current = await html('/reviews');
    expect(current).toContain(lead);
    expect(current).not.toContain(other);

    const past = await html('/reviews?term=2026-winter');
    expect(past).toContain(other);
    expect(past).not.toContain(lead);
  });

  it('shows course, material and location text written only in Chinese with its lang', async () => {
    const course = seedCourse(test.d1, { code: 'CSC108H5', title: { zh: '计算机编程导论', en: '' }, description: { zh: '入门课程。', en: '' } });
    const session = seedSession(test.d1, { courseId: course, term: '2026-fall', startsAt: '2026-10-30T18:00', location: { zh: '学生中心', en: '' } });
    seedMaterial(test.d1, { sessionId: session, url: 'https://drive.example.com/week6', kind: 'slides', label: { zh: '', en: 'Week 6 slides' } });
    seedMaterial(test.d1, { sessionId: session, url: 'https://drive.example.com/mock', kind: 'practice', label: { zh: '模拟题', en: '' } });

    const list = await html('/reviews');
    expect(list).toContain('<p class="course__title"><span lang="zh-CN">计算机编程导论</span></p>');
    expect(list).toContain('<p class="course__text" lang="zh-CN">入门课程。</p>');
    expect(list).not.toContain('course__text zh-text');
    expect(list).toContain('<span class="doc-item__meta"><span lang="zh-CN">计算机编程导论</span></span>');
    expect(list).toContain(' · In person · <span lang="zh-CN">学生中心</span></p>');

    const page = await html('/reviews/csc108h5');
    expect(page).toContain('<p class="page-hero__lead"><strong><span lang="zh-CN">计算机编程导论</span></strong></p>');
    expect(page).toContain('<div class="prose page-hero__lead" lang="zh-CN"><p>入门课程。</p></div>');
    expect(page).toContain('<a class="material" href="https://drive.example.com/week6" target="_blank" rel="noopener noreferrer"><svg');
    expect(page).toContain('Week 6 slides</a>');
    expect(page).toContain('<a class="material" href="https://drive.example.com/mock" target="_blank" rel="noopener noreferrer" lang="zh-CN">');
    expect(page).toContain('模拟题</a>');
  });
});
