import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl } from '@msc-web/content';
import { app } from '../../../app';
import { createTestEnv, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const AT = '2026-09-01T00:00:00.000Z';
const PHOTO_KEY = 'img/2026/0123456789abcdef0123456789abcdef.jpg';
const SCRIPT_NAME = '<script>alert(1)</script>';

function occurrences(html: string, text: string): number {
  return html.split(text).length - 1;
}

/** The page content between the header and the footer, so header links do not count. */
/** 页眉与页脚之间的页面内容，页眉中的链接因此不会被计入。 */
function mainOf(html: string): string {
  return html.slice(html.indexOf('<main'), html.indexOf('</main>'));
}

describe.skipIf(!sqlite)('Our People pages', () => {
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
    expect(occurrences(html, '<h1')).toBe(1);
    return html;
  }

  async function seedPeople() {
    await insertMedia(
      test.d1.db,
      { key: PHOTO_KEY, url: mediaUrl(PHOTO_KEY), kind: 'image', contentType: 'image/jpeg', size: 4, width: 800, height: 1000, fileName: 'wang.jpg', createdAt: AT },
      'mem_president',
    );
    await test.media.bucket.put(PHOTO_KEY, new Uint8Array([255, 216, 255, 224]));
    test.d1.exec(`
      INSERT INTO people (id, section, position, department, name_zh, name_en, sort_order, visible, created_at, updated_at) VALUES
        ('advisor', 'advisor', 'advisor', NULL, '陈教授', 'Prof. Chen', 0, 1, '${AT}', '${AT}'),
        ('advisor-hidden', 'advisor', 'advisor', NULL, '隐藏顾问', 'Hidden Advisor', 0, 0, '${AT}', '${AT}'),
        ('vice-late', 'department', 'vice_head', 'academic', '赵副部长', 'Zhao Vice', 2, 1, '${AT}', '${AT}'),
        ('vice-early', 'department', 'vice_head', 'academic', '钱副部长', 'Qian Vice', 1, 1, '${AT}', '${AT}'),
        ('head-academic', 'department', 'head', 'academic', '李部长', 'Li Head', 0, 1, '${AT}', '${AT}'),
        ('head-technology-hidden', 'department', 'head', 'technology', '隐藏部长', 'Hidden Head', 0, 0, '${AT}', '${AT}'),
        ('finance', 'presidium', 'vp_finance', NULL, '${SCRIPT_NAME}', '', 0, 1, '${AT}', '${AT}'),
        ('secretary-hidden', 'presidium', 'secretary_general', NULL, '隐藏秘书', 'Hidden Secretary', 0, 0, '${AT}', '${AT}'),
        ('president', 'presidium', 'president', NULL, '王会长', 'Wang Hui', 0, 1, '${AT}', '${AT}');
      UPDATE people SET affiliation_zh = '计算机科学 三年级', affiliation_en = 'Computer Science, Year 3',
        bio_zh = '第一段简介。' || char(10) || char(10) || '第二段简介。', bio_en = 'First paragraph.' || char(10) || char(10) || 'Second paragraph.',
        photo_key = '${PHOTO_KEY}', email = 'wang@example.com', link_url = 'https://example.com/wang'
        WHERE id = 'president';
      UPDATE people SET title_zh = '学术部部长兼复习统筹', title_en = 'Head of Academic and Reviews' WHERE id = 'head-academic';
      UPDATE people SET affiliation_zh = '多伦多大学', affiliation_en = 'University of Toronto' WHERE id = 'advisor';
    `);
  }

  describe('hub', () => {
    it.each([
      { path: '/people', title: '我们的团队', links: ['/people/presidium', '/people/advisors', '/people/departments'], labels: ['主席团', '荣誉顾问', '部长团'] },
      {
        path: '/en/people',
        title: 'Our People',
        links: ['/en/people/presidium', '/en/people/advisors', '/en/people/departments'],
        labels: ['Presidium', 'Honorary Advisors', 'Department Leads'],
      },
    ])('links $path to the three pages in menu order', async ({ path, title, links, labels }) => {
      const main = mainOf(await render(path));
      expect(main).toContain(`<h1 class="page-hero__title">${title}</h1>`);
      const positions = links.map((link, index) => main.indexOf(`<a class="card__link" href="${link}">${labels[index]}</a>`));
      expect(positions.every((position) => position > 0)).toBe(true);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    });

    it.each([
      { path: '/people', lead: '联盟由主席团、五个部门的部长团与荣誉顾问组成，均依照章程第四条设立。' },
      {
        path: '/en/people',
        lead: 'The Group is made up of the Presidium, the leads of its five Departments and its Honorary Advisors, as set out in Article 4 of the constitution.',
      },
    ])('describes what the Group is made up of on $path, in the lead and the description', async ({ path, lead }) => {
      const html = await render(path);
      expect(html).toContain(`<p class="page-hero__lead">${lead}</p>`);
      expect(html).toContain(`<meta name="description" content="${lead}"/>`);
      expect(html).not.toContain('The Group is led by');
    });
  });

  describe('Presidium', () => {
    it.each([
      { path: '/people/presidium', title: '主席团', vacant: '待公布', duties: '统筹联盟运作' },
      { path: '/en/people/presidium', title: 'Presidium', vacant: 'To be announced', duties: 'Oversees the Group' },
    ])('shows all four offices as vacant on $path from an empty database', async ({ path, title, vacant, duties }) => {
      const main = mainOf(await render(path));
      expect(main).toContain(`<h1 class="page-hero__title" id="people-title">${title}</h1>`);
      expect(occurrences(main, 'class="person person--vacant"')).toBe(4);
      expect(main).toContain(vacant);
      expect(main).toContain(duties);
      expect(main).not.toContain('class="dept"');
    });

    it.each([
      { path: '/people/presidium', office: '主席', heading: '<span class="sr-only">主席：</span>待公布' },
      { path: '/en/people/presidium', office: 'President', heading: '<span class="sr-only">President: </span>To be announced' },
    ])('names each vacant office in its heading on $path and hides the repeated title line', async ({ path, office, heading }) => {
      const main = mainOf(await render(path));
      expect(main).toContain(`<p class="person__title" aria-hidden="true">${office}</p><h2 class="person__name">${heading}</h2>`);
      expect(occurrences(main, '<span class="sr-only">')).toBe(4);
    });

    it('shows visible holders in office order with their details and nothing from other groups', async () => {
      await seedPeople();
      const main = mainOf(await render('/people/presidium'));
      expect(main).not.toContain('隐藏');
      expect(main).not.toContain('李部长');
      expect(main).not.toContain('陈教授');
      // The Secretary-General is hidden and nobody holds the VP Audit office.
      // 秘书长已隐藏，监督审计副主席无人担任。
      expect(occurrences(main, 'class="person person--vacant"')).toBe(2);
      expect(main.indexOf('王会长')).toBeLessThan(main.indexOf('&lt;script&gt;'));
      expect(main).toContain(`src="${mediaUrl(PHOTO_KEY)}" alt="王会长"`);
      expect(main).toContain('<h2 class="person__name"><a class="person__link" href="/people/president">王会长</a></h2>');
      expect(main).toContain('<p class="muted small" lang="en-CA">Wang Hui</p>');
      expect(main).toContain('<p class="person__affiliation">计算机科学 三年级</p>');
      // The bio and contact links are on the person's own page, not in the list.
      // 简介与联系方式在个人页面上，不在列表中。
      expect(main).not.toContain('第一段简介');
      expect(main).not.toContain('mailto:');
      expect(main).not.toContain('https://example.com/wang');
      expect(occurrences(main, '<span class="person__more" aria-hidden="true">查看简介')).toBe(2);
    });

    it('escapes names as text and switches the name order in English', async () => {
      await seedPeople();
      const html = await render('/en/people/presidium');
      expect(html).not.toContain(SCRIPT_NAME);
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(html).toContain('<h2 class="person__name"><a class="person__link" href="/en/people/president">Wang Hui</a></h2>');
      expect(html).toContain('<p class="muted small" lang="zh-CN">王会长</p>');
      expect(html).toContain('Vice-President Finance');
    });

    it('marks a name shown in the other language with its lang and gives a monogram the shared initials', async () => {
      await seedPeople();
      test.d1.exec("UPDATE people SET name_zh = '', name_en = 'Ada Lin' WHERE id = 'finance'");
      const chinese = mainOf(await render('/people/presidium'));
      expect(chinese).toContain('<div class="person__monogram" aria-hidden="true">AL</div>');
      expect(chinese).toContain('<h2 class="person__name" lang="en-CA"><a class="person__link" href="/people/finance">Ada Lin</a></h2>');
      expect(chinese).toContain('<h2 class="person__name"><a class="person__link" href="/people/president">王会长</a></h2>');
      expect(chinese).toContain(`alt="王会长"`);

      test.d1.exec("UPDATE people SET name_zh = '赵敏', name_en = '' WHERE id = 'finance'");
      const english = mainOf(await render('/en/people/presidium'));
      expect(english).toContain('<div class="person__monogram" aria-hidden="true">赵</div>');
      expect(english).toContain('<h2 class="person__name" lang="zh-CN"><a class="person__link" href="/en/people/finance">赵敏</a></h2>');
      expect(english).toContain('<p class="person__affiliation">Computer Science, Year 3</p>');
    });
  });

  describe('Department Leads', () => {
    it('lists the five departments with a vacant Head card where nobody is shown', async () => {
      const main = mainOf(await render('/en/people/departments'));
      expect(occurrences(main, 'class="dept"')).toBe(5);
      expect(occurrences(main, 'class="person person--vacant"')).toBe(5);
      expect(main).toContain('<h2 class="dept__name" id="dept-technology">Technology Department</h2>');
      expect(main).toContain('<h3 class="person__name"><span class="sr-only">Head of Technology: </span>To be announced</h3>');
    });

    it('puts the Head before Vice Heads in sort order and keeps hidden heads out', async () => {
      await seedPeople();
      const main = mainOf(await render('/people/departments'));
      expect(main).not.toContain('隐藏部长');
      expect(main).not.toContain('王会长');
      const order = ['李部长', '钱副部长', '赵副部长'].map((name) => main.indexOf(name));
      expect(order.every((index) => index > 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      expect(main).toContain('学术部部长兼复习统筹');
      expect(main).toContain('学术部副部长');
      expect(main).toContain('<h3 class="person__name"><a class="person__link" href="/people/head-academic">李部长</a></h3>');
      expect(occurrences(main, 'class="person person--vacant"')).toBe(4);
    });
  });

  describe('Honorary Advisors', () => {
    it('says the list is coming when there is nobody to show', async () => {
      const main = mainOf(await render('/people/advisors'));
      expect(main).toContain('荣誉顾问名单即将公布');
    });

    it('shows visible advisors only', async () => {
      await seedPeople();
      const main = mainOf(await render('/en/people/advisors'));
      expect(main).toContain('<h2 class="person__name"><a class="person__link" href="/en/people/advisor">Prof. Chen</a></h2>');
      expect(main).toContain('University of Toronto');
      expect(main).not.toContain('Hidden Advisor');
      expect(main).not.toContain('Our Honorary Advisors will be announced soon');
    });
  });

  describe('person page', () => {
    async function status(path: string): Promise<number> {
      const ctx = testExecutionContext();
      const response = await app.request(path, {}, test.env, ctx);
      await ctx.settle();
      return response.status;
    }

    it('shows the bio, affiliation and contact links, with the way back to the Presidium', async () => {
      await seedPeople();
      const html = await render('/people/president');
      const main = mainOf(html);
      expect(main).toContain('<a class="backlink" href="/people/presidium">');
      expect(main).toContain('<div class="eyebrow">主席</div>');
      expect(main).toContain('<h1 class="page-hero__title">王会长</h1>');
      expect(main).toContain('<p class="page-hero__lead" lang="en-CA">Wang Hui</p>');
      expect(main).toContain(`<img class="profile__photo" src="${mediaUrl(PHOTO_KEY)}" alt="王会长"`);
      expect(main).toContain('<p class="profile__affiliation">计算机科学 三年级</p>');
      expect(main).toContain('<div class="prose profile__bio"><p>第一段简介。</p><p>第二段简介。</p></div>');
      expect(main).toContain('href="mailto:wang@example.com"');
      expect(main).toContain('href="https://example.com/wang" rel="noopener noreferrer" target="_blank"');
      expect(html).toContain('<title>王会长 · UTMMSC 国语学者联盟</title>');
      expect(html).toContain('<meta name="description" content="主席 · 计算机科学 三年级"/>');
      expect(html).toContain(`<meta property="og:image" content="https://utmmsc.com${mediaUrl(PHOTO_KEY)}"/>`);
    });

    it('speaks the page language and leads back to the page that lists each group', async () => {
      await seedPeople();
      const president = mainOf(await render('/en/people/president'));
      expect(president).toContain('<a class="backlink" href="/en/people/presidium">');
      expect(president).toContain('<h1 class="page-hero__title">Wang Hui</h1>');
      expect(president).toContain('<div class="prose profile__bio"><p>First paragraph.</p><p>Second paragraph.</p></div>');

      const advisor = mainOf(await render('/people/advisor'));
      expect(advisor).toContain('<a class="backlink" href="/people/advisors">');
      expect(advisor).toContain('<p class="profile__affiliation">多伦多大学</p>');
      expect(advisor).toContain('<div class="profile__photo person__monogram" aria-hidden="true">陈</div>');

      const head = mainOf(await render('/people/head-academic'));
      expect(head).toContain('<a class="backlink" href="/people/departments">');
      expect(head).toContain('<div class="eyebrow">学术部部长兼复习统筹</div>');
    });

    it('escapes the name and finds nobody hidden, unknown or malformed', async () => {
      await seedPeople();
      const html = await render('/people/finance');
      expect(html).not.toContain(SCRIPT_NAME);
      expect(html).toContain('<h1 class="page-hero__title">&lt;script&gt;alert(1)&lt;/script&gt;</h1>');
      expect(await status('/people/advisor-hidden')).toBe(404);
      expect(await status('/people/nobody')).toBe(404);
      expect(await status('/en/people/bad.id')).toBe(404);
    });
  });

  describe('navigation', () => {
    it('marks the open page in the tabs and in the header dropdown, and its parent as current', async () => {
      const html = await render('/people/advisors');
      expect(html).toContain('<a class="site-nav__link site-nav__link--parent" href="/people" aria-current="true">');
      expect(html).toContain('<a class="site-nav__menu-link" href="/people/advisors" aria-current="page">荣誉顾问</a>');
      expect(html).toContain('<a class="site-nav__menu-link" href="/people/presidium">主席团</a>');
      expect(html).toContain('<a class="tab" href="/people/advisors" aria-current="page">荣誉顾问</a>');
      expect(html).toContain('<a class="backlink" href="/people">');
    });

    it('offers the dropdown on every page, in the page language, and in the phone menu', async () => {
      const html = await render('/en/events');
      const menu = html.slice(html.indexOf('<div class="site-nav__panel">'));
      const order = ['/en/people/presidium', '/en/people/advisors', '/en/people/departments'].map((href) => menu.indexOf(`href="${href}"`));
      expect(order.every((index) => index >= 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      expect(html).toContain('<div class="mobile-nav__sub">');
      expect(occurrences(html, 'href="/en/people/departments"')).toBe(2);
    });

    it('marks the hub itself as the current page', async () => {
      const html = await render('/people');
      expect(html).toContain('<a class="site-nav__link site-nav__link--parent" href="/people" aria-current="page">');
    });
  });
});
