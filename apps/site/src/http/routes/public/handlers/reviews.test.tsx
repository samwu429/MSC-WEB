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
    expect(page).toContain('<a class="tab" href="/reviews" aria-current="page">2026 秋季学期</a>');
    expect(page).toContain('<a class="tab" href="/reviews?term=2026-winter">2026 冬季学期</a>');
    expect(page).not.toContain('2025 秋季学期');
    expect(page).toContain('notice notice--integrity');
    expect(page).toContain('章程第 2.3 条');
    expect(page).toContain('<a class="course__code" href="/reviews/csc108h5">CSC108H5</a>');
    expect(page).not.toContain('<a class="course__code" href="/reviews/mat135h5">');
    expect(page).toContain('<a class="doc-item__title" href="/reviews/mat135h5">MAT135H5</a>');
    expect(page).not.toContain('ECO101H5');
    expect(page).not.toContain('草稿场次');
    expect(page).toContain('期中复习 · 第 1-5 章');
    expect(page).toContain('href="https://forms.example.com/csc108-midterm"');
    expect(page.match(/<h1[ >]/g)).toHaveLength(1);
    expect(page).not.toMatch(/ style=|<script/);
  });

  it('shows an explicitly requested term', async () => {
    seedCourses();
    const page = await html('/reviews?term=2026-winter');
    expect(page).toContain('<a class="tab" href="/reviews?term=2026-winter" aria-current="page">2026 冬季学期</a>');
    expect(page).toContain('<a class="course__code" href="/reviews/mat135h5">MAT135H5</a>');
    expect(page).toContain('href="https://video.example.com/csc108-final"');
    expect(page).not.toContain('href="https://forms.example.com/csc108-final"');
  });

  it('falls back to the current term for malformed or unlisted terms', async () => {
    seedCourses();
    for (const term of ['nonsense', '2026-spring', '2025-fall', '2019-winter']) {
      const page = await html(`/reviews?term=${term}`);
      expect(page, term).toContain('<a class="tab" href="/reviews" aria-current="page">2026 秋季学期</a>');
      expect(page, term).toContain('<a class="course__code" href="/reviews/csc108h5">');
    }
  });

  it('always offers the current term, with an empty state when it has no reviews', async () => {
    seedSession(test.d1, { courseId: seedCourse(test.d1, { code: 'MAT135H5' }), term: '2026-winter' });
    const page = await html('/reviews');
    expect(page).toContain('<a class="tab" href="/reviews" aria-current="page">2026 秋季学期</a>');
    expect(page).toContain('这个学期还没有发布复习');
    expect(page).toContain('href="/reviews/mat135h5"');
  });

  it('renders the reviews page in English', async () => {
    seedCourses();
    const page = await html('/en/reviews');
    expect(page).toContain('<html lang="en-CA">');
    expect(page).toContain('aria-current="page">Fall 2026</a>');
    expect(page).toContain('href="/en/reviews/csc108h5"');
    expect(page).toContain('Midterm Review · Chapters 1-5');
    expect(page).toContain('Article 2.3');
  });

  it('links a course card to the materials of each session on the course page', async () => {
    const { upcoming } = seedCourses();
    await seedMedia(test.env.DB, test.media.bucket, SLIDES);
    seedMaterial(test.d1, { sessionId: upcoming, mediaKey: SLIDES });
    seedMaterial(test.d1, { sessionId: upcoming, url: 'https://drive.example.com/practice', kind: 'practice' });
    const page = await html('/reviews');
    expect(page).toContain(`href="/reviews/csc108h5#session-${upcoming}"`);
    expect(page).toContain('资料（2）');
  });

  it('shows a course page by lowercase code with sessions grouped by term and materials linked', async () => {
    const { upcoming, past } = seedCourses();
    await seedMedia(test.env.DB, test.media.bucket, SLIDES);
    seedMaterial(test.d1, { sessionId: upcoming, mediaKey: SLIDES, sortOrder: 1 });
    seedMaterial(test.d1, { sessionId: upcoming, url: 'https://drive.example.com/practice', kind: 'practice', label: { zh: '模拟题', en: 'Mock exam' }, sortOrder: 2 });

    const page = await html('/reviews/csc108h5');
    expect(page).toContain('<h1 class="page-hero__title">CSC108H5</h1>');
    expect(page).toContain('计算机编程导论');
    expect(page.indexOf('id="term-2026-fall"')).toBeLessThan(page.indexOf('id="term-2026-winter"'));
    expect(page).toContain(`id="session-${upcoming}"`);
    expect(page).toContain(`<a class="material" href="/media/${SLIDES}" type="application/pdf">`);
    expect(page).toContain('课件</a>');
    expect(page).toContain('<a class="material" href="https://drive.example.com/practice" target="_blank" rel="noopener noreferrer">');
    expect(page).toContain('模拟题</a>');
    expect(page).toContain('主讲：Alex Chen');
    expect(page).toContain('请自带电脑。');
    expect(page).toContain('href="https://forms.example.com/csc108-midterm"');
    expect(page).toContain(`id="session-${past}"`);
    expect(page).toContain('href="https://video.example.com/csc108-final"');
    expect(page).not.toContain('href="https://forms.example.com/csc108-final"');
    expect(page).not.toContain('草稿场次');

    const english = await html('/en/reviews/csc108h5');
    expect(english).toContain('Mock exam</a>');
    expect(english).toContain('Slides</a>');
    expect(english).toContain('Presenters: Alex Chen');
    expect(english).toContain('href="/en/reviews"');
  });

  it('shows a visible course without published sessions with an empty state', async () => {
    seedCourse(test.d1, { code: 'PSY100H5' });
    const page = await html('/reviews/psy100h5');
    expect(page).toContain('这门课程暂时没有已发布的复习');
  });

  it('redirects other casings of a course code to the lowercase address', async () => {
    seedCourses();
    const chinese = await get('/reviews/CSC108H5');
    expect(chinese.status).toBe(301);
    expect(new URL(chinese.headers.get('location') ?? '', 'https://utmmsc.com').pathname).toBe('/reviews/csc108h5');
    const english = await get('/en/reviews/Csc108h5');
    expect(english.status).toBe(301);
    expect(new URL(english.headers.get('location') ?? '', 'https://utmmsc.com').pathname).toBe('/en/reviews/csc108h5');
  });

  it('answers 404 for hidden, unknown and malformed courses', async () => {
    seedCourses();
    for (const path of ['/reviews/eco101h5', '/en/reviews/eco101h5', '/reviews/csc999h5', '/reviews/not-a-course', '/reviews/%3Cscript%3E']) {
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

  it.each([
    { path: '/reviews', lead: '本学期已安排复习的课程。', other: '所选学期开设复习的课程。' },
    { path: '/en/reviews', lead: 'Courses with reviews scheduled this term.', other: 'Courses with reviews in the selected term.' },
  ])('says "this term" on $path only for the current term', async ({ path, lead, other }) => {
    seedCourses();
    const current = await html(path);
    expect(current).toContain(`<p class="section-lead">${lead}</p>`);
    expect(current).not.toContain(other);

    const past = await html(`${path}?term=2026-winter`);
    expect(past).toContain(`<p class="section-lead">${other}</p>`);
    expect(past).not.toContain(lead);
  });

  it('marks course, material and location text shown in the other language with its lang', async () => {
    const course = seedCourse(test.d1, { code: 'CSC108H5', title: { zh: '计算机编程导论', en: '' }, description: { zh: '入门课程。', en: '' } });
    const session = seedSession(test.d1, { courseId: course, term: '2026-fall', startsAt: '2026-10-30T18:00', location: { zh: '学生中心', en: '' } });
    seedMaterial(test.d1, { sessionId: session, url: 'https://drive.example.com/week6', kind: 'slides', label: { zh: '', en: 'Week 6 slides' } });

    const list = await html('/en/reviews');
    expect(list).toContain('<p class="course__title" lang="zh-CN">计算机编程导论</p>');
    expect(list).toContain('<p class="course__text" lang="zh-CN">入门课程。</p>');
    expect(list).toContain('<span class="doc-item__meta" lang="zh-CN">计算机编程导论</span>');
    expect(list).toContain(' · In person · <span lang="zh-CN">学生中心</span></p>');

    const english = await html('/en/reviews/csc108h5');
    expect(english).toContain('<p class="page-hero__lead" lang="zh-CN"><strong>计算机编程导论</strong></p>');
    expect(english).toContain('<div class="prose page-hero__lead" lang="zh-CN"><p>入门课程。</p></div>');
    expect(english).toContain('<a class="material" href="https://drive.example.com/week6" target="_blank" rel="noopener noreferrer"><svg');

    const chinese = await html('/reviews/csc108h5');
    expect(chinese).toContain('<p class="page-hero__lead"><strong>计算机编程导论</strong></p>');
    expect(chinese).toContain('<a class="material" href="https://drive.example.com/week6" target="_blank" rel="noopener noreferrer" lang="en-CA">');
    expect(chinese).toContain('Week 6 slides</a>');
    expect(chinese).not.toContain('课件</a>');
    expect(chinese).toContain(' · 线下 · <span>学生中心</span></p>');
  });
});
