import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mediaUrl } from '@msc-web/content';
import { app } from '../../../app';
import { createTestEnv, testExecutionContext, type TestEnv } from '../../../testing/test-env';
import { insertMedia } from '../../../../infrastructure/d1/media';
import { sqlite } from '../../../../infrastructure/d1/testing/sqlite-d1';

const AT = '2026-09-01T00:00:00.000Z';
const PHOTO_KEY = 'img/2026/0123456789abcdef0123456789abcdef.jpg';
const SCRIPT_NAME = '<script>alert(1)</script>';
const TILE = '<li class="person">';
const ADVISORS_LIST = '<ul class="people-grid people-grid--advisors" role="list">';
const OFFICERS_LIST = '<ul class="people-grid" role="list">';
const DEPARTMENTS_LINK = '<p class="section-more"><a class="link-arrow" href="/about#about-departments">What each Department does<svg';
const PRESIDIUM_OFFICES = ['President', 'Secretary-General', 'Vice-President Finance', 'Vice-President Supervision &amp; Audit'];
const HEADS = ['Head of Technology', 'Head of Academic', 'Head of Publicity', 'Head of Sponsorship', 'Head of Events'];

function occurrences(html: string, text: string): number {
  return html.split(text).length - 1;
}

/** The page content between the header and the footer, so header links do not count. */
/** 页眉与页脚之间的页面内容，页眉中的链接因此不会被计入。 */
function mainOf(html: string): string {
  return html.slice(html.indexOf('<main'), html.indexOf('</main>'));
}

/** One vacant office as its quiet line: the office, a pause for screen readers, then "To be announced". */
/** 一个空缺职位的那一行安静的文字：职位名称、供读屏软件停顿的冒号，然后是 "To be announced"。 */
function vacancy(office: string): string {
  return `<li><span class="vacancies__office">${office}</span><span class="sr-only">: </span><span class="vacancies__status">To be announced</span></li>`;
}

/** Every text is in the html, in the given order. */
/** 每段文字都出现在 html 中，并且按给定的顺序排列。 */
function expectInOrder(html: string, texts: string[]) {
  const positions = texts.map((text) => html.indexOf(text));
  expect(positions.every((position) => position >= 0), texts.filter((text) => !html.includes(text)).join(', ')).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
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

  /** Our People is English only, so its page content carries no Chinese characters. */
  /** "我们的团队" 只显示英文，因此其页面内容不含任何中文字符。 */
  function expectNoChinese(main: string) {
    expect(main).not.toMatch(/[一-鿿]/);
  }

  /** Nobody is drawn as an empty photo frame or a tile: neither people nor photos nor monograms are on the page. */
  /** 没有任何内容显示为空白照片框或方块：页面上既没有成员，也没有照片或姓名首字。 */
  function expectNoTiles(main: string) {
    expect(main).not.toContain('people-grid');
    expect(main).not.toContain(TILE);
    expect(main).not.toContain('class="person__photo"');
    expect(main).not.toContain('class="person__monogram"');
  }

  describe('everyone', () => {
    it('lists the Honorary Advisors, then the Presidium, then the Department Leads, in English only', async () => {
      await seedPeople();
      const main = mainOf(await render('/people'));
      expect(main).toContain('<h1 class="page-hero__title" id="people-title">Our People</h1>');
      expectInOrder(
        main,
        ['people-advisors">Honorary Advisors', 'people-presidium">Presidium', 'people-departments">Department Leads'].map((heading) => `<h2 class="section-title" id="${heading}</h2>`),
      );
      expectInOrder(
        main,
        ['Prof. Chen', 'Wang Hui', 'Li Head', 'Qian Vice'].map((name) => `>${name}</a>`),
      );
      // Everyone listed links to their own page exactly once.
      // 每位列出的成员都恰好有一个指向其个人页面的链接。
      for (const id of ['advisor', 'president', 'finance', 'head-academic', 'vice-early', 'vice-late']) {
        expect(occurrences(main, `href="/people/${id}"`)).toBe(1);
      }
      expect(main).not.toContain('Hidden');
      expectNoChinese(main);
    });

    it("nests every name under its group's h2 as an h3, with no Department headings in between", async () => {
      await seedPeople();
      const main = mainOf(await render('/people'));
      expect(main).toContain('<h3 class="person__name"><a class="person__link" href="/people/advisor">Prof. Chen</a></h3>');
      expect(main).toContain('<h3 class="person__name"><a class="person__link" href="/people/president">Wang Hui</a></h3>');
      expect(main).toContain('<h3 class="person__name"><a class="person__link" href="/people/head-academic">Li Head</a></h3>');
      expect(main).toContain('<h3 class="person__name"><a class="person__link" href="/people/vice-early">Qian Vice</a></h3>');
      expect(occurrences(main, '<h3 class="person__name"')).toBe(6);
      expect(main).not.toContain('<h4');
      expect(main).not.toContain('department__name');
      expect(main).not.toContain('id="dept-');
    });

    it('draws everyone as the same tile, in one list per group, under titles without eyebrows', async () => {
      await seedPeople();
      const main = mainOf(await render('/people'));
      expect(occurrences(main, 'people-tier"')).toBe(3);
      // Only the hero keeps its eyebrow; the groups have no "Article 4.x" labels.
      // 只有页首保留眉标；各团体不再有 "Article 4.x" 标签。
      expect(occurrences(main, 'class="eyebrow"')).toBe(1);
      expect(main).not.toContain('Article 4.');
      expect(occurrences(main, TILE)).toBe(6);
      expect(occurrences(main, '<li class="person')).toBe(6);
      expect(occurrences(main, ADVISORS_LIST)).toBe(1);
      expect(occurrences(main, OFFICERS_LIST)).toBe(2);
      expectInOrder(main, [ADVISORS_LIST, 'id="people-presidium"', OFFICERS_LIST, 'id="people-departments"']);
      expect(main.indexOf(OFFICERS_LIST, main.indexOf('id="people-departments"'))).toBeGreaterThan(0);
      // The president has a photo, which still loads lazily; everyone else has a monogram in the same frame.
      // 主席有照片，照片仍然延迟加载；其他人在同样的框中显示姓名首字。
      expect(main).toContain(`<img class="person__photo" src="${mediaUrl(PHOTO_KEY)}" alt="" loading="lazy" decoding="async"/>`);
      expect(occurrences(main, '<div class="person__monogram" aria-hidden="true">')).toBe(5);
      for (const gone of ['person--', 'portraits', 'class="offices"', 'class="departments"', 'class="department', 'person__duties']) {
        expect(main, gone).not.toContain(gone);
      }
    });

    it('shows each vacant office as one quiet line under its group, never as a tile or a heading', async () => {
      await seedPeople();
      const main = mainOf(await render('/people'));
      const presidium = main.slice(main.indexOf('id="people-presidium"'), main.indexOf('id="people-departments"'));
      const departments = main.slice(main.indexOf('id="people-departments"'));
      // The Secretary-General is hidden and nobody holds the VP Audit office; they follow the holders in office order.
      // 秘书长已隐藏，监督审计副主席无人担任；两者按职位顺序排在担任者之后。
      expectInOrder(presidium, ['Wang Hui', '&lt;script&gt;', '<ul class="vacancies" role="list">', vacancy('Secretary-General'), vacancy('Vice-President Supervision &amp; Audit')]);
      expect(occurrences(presidium, '<li><span class="vacancies__office">')).toBe(2);
      // The Technology Head is hidden; the other three Departments have nobody shown.
      // 科技部部长已隐藏；另外三个部门没有人显示。
      expectInOrder(departments, ['Zhao Vice', '<ul class="vacancies" role="list">', ...['Head of Technology', 'Head of Publicity', 'Head of Sponsorship', 'Head of Events'].map(vacancy)]);
      expect(occurrences(departments, '<li><span class="vacancies__office">')).toBe(4);
      // "To be announced" appears only in those lines.
      // "To be announced" 只出现在这些行中。
      expect(occurrences(main, 'To be announced')).toBe(6);
      expect(occurrences(main, '<span class="vacancies__status">To be announced</span></li>')).toBe(6);
    });

    it('shows four Presidium lines, five Head lines and the advisors note from an empty database', async () => {
      const main = mainOf(await render('/people'));
      expect(main).toContain('Our Honorary Advisors will be announced soon');
      expectInOrder(main, ['id="people-presidium"', ...PRESIDIUM_OFFICES.map(vacancy), 'id="people-departments"', ...HEADS.map(vacancy)]);
      expect(occurrences(main, '<ul class="vacancies" role="list">')).toBe(2);
      expect(occurrences(main, '<li><span class="vacancies__office">')).toBe(9);
      expectNoTiles(main);
      expectNoChinese(main);
    });

    it("links from the Department Leads' lead to what each Department does on the About page, which has that anchor", async () => {
      const main = mainOf(await render('/people'));
      expect(occurrences(main, DEPARTMENTS_LINK)).toBe(1);
      expectInOrder(main, ['id="people-departments"', '<p class="section-lead">Each of the five Departments', DEPARTMENTS_LINK, vacancy('Head of Technology')]);
      // The remits themselves are only on the About page now.
      // 各部门的职能现在只在关于页面上。
      expect(main).not.toContain('GitHub organization');
      expect(main).not.toContain('department__remit');

      const about = mainOf(await render('/about'));
      expect(about).toContain('<div class="dept" role="group" aria-labelledby="about-departments"><div class="dept__head"><h3 class="dept__name" id="about-departments">');
      expect(about).toContain('Manages the Group&#39;s GitHub organization');
    });

    it('describes what the Group is made up of, in the lead and the description', async () => {
      const lead = 'The Group is made up of its Honorary Advisors, the Presidium and the leads of its five Departments, as set out in Article 4 of the constitution.';
      const html = await render('/people');
      expect(html).toContain('<div class="eyebrow">The UTMMSC team</div>');
      expect(html).toContain(`<p class="page-hero__lead">${lead}</p>`);
      expect(html).toContain(`<meta name="description" content="${lead}"/>`);
    });
  });

  describe("a group's own page", () => {
    const GROUPS = { '/people/advisors': 'Honorary Advisors', '/people/presidium': 'Presidium', '/people/departments': 'Department Leads' };

    it('says it is part of Our People in its eyebrow, without Article labels, and has room for larger tiles', async () => {
      await seedPeople();
      for (const [path, title] of Object.entries(GROUPS)) {
        const main = mainOf(await render(path));
        expect(main, path).toContain(`<div class="eyebrow">Our People</div><h1 class="page-hero__title" id="people-title">${title}</h1>`);
        expect(main, path).not.toContain('Article 4.');
        expect(main, path).toContain('<section class="section people-page" aria-labelledby="people-title">');
        expect(main, path).not.toContain('people-tier');
        expect(occurrences(main, '<h2 class="person__name">'), path).toBeGreaterThan(0);
        expect(main, path).not.toContain('<h3');
      }
    });

    it('links to what each Department does only from the Department Leads, in the hero', async () => {
      const departments = mainOf(await render('/people/departments'));
      const hero = departments.slice(0, departments.indexOf('</header>'));
      expect(occurrences(departments, DEPARTMENTS_LINK)).toBe(1);
      expect(hero).toContain(`Every member may join up to two Departments.</p>${DEPARTMENTS_LINK}`);
      for (const path of ['/people/advisors', '/people/presidium']) {
        expect(mainOf(await render(path)), path).not.toContain('about-departments');
      }
    });
  });

  describe('Presidium', () => {
    it('shows all four offices as vacant lines from an empty database, without tiles, frames or duties', async () => {
      const main = mainOf(await render('/people/presidium'));
      expect(main).toContain('<h1 class="page-hero__title" id="people-title">Presidium</h1>');
      expect(main).toContain(`<ul class="vacancies" role="list">${PRESIDIUM_OFFICES.map(vacancy).join('')}</ul>`);
      expectNoTiles(main);
      // A vacancy is not a heading, and the office duties stay on the About page.
      // 空缺不是标题，各职位的职责留在关于页面上。
      expect(main).not.toContain('<h2');
      expect(main).not.toContain('Oversees the Group');
      expect(main).not.toContain('class="department');
      expectNoChinese(main);
    });

    it('shows visible holders in office order with their details, then a line for each vacant office, and nothing from other groups', async () => {
      await seedPeople();
      const main = mainOf(await render('/people/presidium'));
      expect(main).not.toContain('Hidden');
      expect(main).not.toContain('Li Head');
      expect(main).not.toContain('Prof. Chen');
      expectInOrder(main, ['Wang Hui', '&lt;script&gt;', vacancy('Secretary-General'), vacancy('Vice-President Supervision &amp; Audit')]);
      expect(occurrences(main, '<li><span class="vacancies__office">')).toBe(2);
      // The photo's alt is empty because the name follows it as the heading.
      // 照片的 alt 为空，因为紧接着的标题就是姓名。
      expect(main).toContain(`<img class="person__photo" src="${mediaUrl(PHOTO_KEY)}" alt="" loading="lazy" decoding="async"/>`);
      expect(main).toContain('<h2 class="person__name"><a class="person__link" href="/people/president">Wang Hui</a></h2><p class="person__title">President</p>');
      expect(main).toContain('<p class="person__title">Vice-President Finance</p>');
      expect(main).toContain('<p class="person__affiliation">Computer Science, Year 3</p>');
      // The bio and contact links are on the person's own page, not in the list; each holder's tile links there once.
      // 简介与联系方式在个人页面上，不在列表中；每位担任者的方块只链接一次到该页面。
      expect(main).not.toContain('First paragraph');
      expect(main).not.toContain('mailto:');
      expect(main).not.toContain('https://example.com/wang');
      expect(occurrences(main, OFFICERS_LIST)).toBe(1);
      expect(occurrences(main, TILE)).toBe(2);
      expect(occurrences(main, 'href="/people/president"')).toBe(1);
      expect(occurrences(main, 'href="/people/finance"')).toBe(1);
      expectNoChinese(main);
    });

    it('escapes names as text and shows the English office titles', async () => {
      await seedPeople();
      const html = await render('/people/presidium');
      expect(html).not.toContain(SCRIPT_NAME);
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(html).toContain('Vice-President Finance');
    });

    it('falls back to the Chinese name with its lang when no English name is written, and gives a monogram its initials', async () => {
      await seedPeople();
      test.d1.exec("UPDATE people SET name_zh = '', name_en = 'Ada Lin' WHERE id = 'finance'");
      const english = mainOf(await render('/people/presidium'));
      expect(english).toContain('<div class="person__monogram" aria-hidden="true">AL</div>');
      expect(english).toContain('<h2 class="person__name"><a class="person__link" href="/people/finance">Ada Lin</a></h2>');

      test.d1.exec("UPDATE people SET name_zh = '赵敏', name_en = '' WHERE id = 'finance'");
      const fallback = mainOf(await render('/people/presidium'));
      expect(fallback).toContain('<div class="person__monogram" aria-hidden="true">赵</div>');
      expect(fallback).toContain('<h2 class="person__name" lang="zh-CN"><a class="person__link" href="/people/finance">赵敏</a></h2>');
      expect(fallback).toContain('<h2 class="person__name"><a class="person__link" href="/people/president">Wang Hui</a></h2>');

      // A nickname in brackets is left out of the initials.
      // 括号中的昵称不计入姓名首字。
      test.d1.exec("UPDATE people SET name_zh = '', name_en = 'Yuan (Andrew) Lai' WHERE id = 'finance'");
      const nickname = mainOf(await render('/people/presidium'));
      expect(nickname).toContain('<div class="person__monogram" aria-hidden="true">YL</div>');
      expect(mainOf(await render('/people/finance'))).toContain('<div class="profile__photo person__monogram" aria-hidden="true">YL</div>');
    });
  });

  describe('Department Leads', () => {
    it('lists a quiet Head line for each of the five Departments from an empty database, without their remits', async () => {
      const main = mainOf(await render('/people/departments'));
      expect(main).toContain(`<ul class="vacancies" role="list">${HEADS.map(vacancy).join('')}</ul>`);
      expectNoTiles(main);
      expect(main).not.toContain('<h2');
      expect(main).not.toContain('class="department');
      expect(main).not.toContain('No ghostwriting');
      expectNoChinese(main);
    });

    it("puts each Department's Head before its Vice Heads in sort order, titled with their Department, and keeps hidden heads out", async () => {
      await seedPeople();
      const main = mainOf(await render('/people/departments'));
      expect(main).not.toContain('Hidden Head');
      expect(main).not.toContain('Wang Hui');
      expectInOrder(main, ['Li Head', 'Qian Vice', 'Zhao Vice']);
      // A lead's own title is kept; otherwise the title names the office and its Department.
      // 负责人的自定义头衔保留；否则头衔写明职位及其所属部门。
      expect(main).toContain('<h2 class="person__name"><a class="person__link" href="/people/head-academic">Li Head</a></h2><p class="person__title">Head of Academic and Reviews</p>');
      expect(occurrences(main, '<p class="person__title">Vice Head of Academic</p>')).toBe(2);
      expect(occurrences(main, OFFICERS_LIST)).toBe(1);
      expect(occurrences(main, TILE)).toBe(3);
      expectInOrder(main, ['Zhao Vice', ...['Head of Technology', 'Head of Publicity', 'Head of Sponsorship', 'Head of Events'].map(vacancy)]);
      expect(occurrences(main, '<li><span class="vacancies__office">')).toBe(4);
      expectNoChinese(main);
    });

    it('lists the Departments in constitution order and keeps the Vice Heads of a Department whose Head is not shown', async () => {
      await seedPeople();
      test.d1.exec(`
        UPDATE people SET visible = 0 WHERE id = 'head-academic';
        INSERT INTO people (id, section, position, department, name_zh, name_en, sort_order, visible, created_at, updated_at) VALUES
          ('head-events', 'department', 'head', 'events', '周部长', 'Zhou Head', 0, 1, '${AT}', '${AT}'),
          ('vice-technology', 'department', 'vice_head', 'technology', '孙副部长', 'Sun Vice', 0, 1, '${AT}', '${AT}');
      `);
      const main = mainOf(await render('/people/departments'));
      expectInOrder(main, ['Sun Vice', 'Qian Vice', 'Zhao Vice', 'Zhou Head']);
      expect(main).toContain('<p class="person__title">Vice Head of Technology</p>');
      expect(main).toContain('<p class="person__title">Head of Events</p>');
      expectInOrder(main, ['Zhou Head', ...['Head of Technology', 'Head of Academic', 'Head of Publicity', 'Head of Sponsorship'].map(vacancy)]);
      expect(occurrences(main, '<li><span class="vacancies__office">')).toBe(4);
      expect(occurrences(main, TILE)).toBe(4);
    });
  });

  describe('Honorary Advisors', () => {
    it('says the list is coming when there is nobody to show', async () => {
      const main = mainOf(await render('/people/advisors'));
      expect(main).toContain('Our Honorary Advisors will be announced soon');
      expectNoTiles(main);
      expectNoChinese(main);
    });

    it("shows visible advisors only, as tiles in the advisors' own list", async () => {
      await seedPeople();
      const main = mainOf(await render('/people/advisors'));
      expect(occurrences(main, ADVISORS_LIST)).toBe(1);
      expect(occurrences(main, TILE)).toBe(1);
      // Without a title of their own an advisor's title is the office itself.
      // 顾问没有自定义头衔时，头衔就是职位名称本身。
      expect(main).toContain(
        '<h2 class="person__name"><a class="person__link" href="/people/advisor">Prof. Chen</a></h2><p class="person__title">Honorary Advisor</p><p class="person__affiliation">University of Toronto</p>',
      );
      expect(main).not.toContain('Hidden Advisor');
      expect(main).not.toContain('Our Honorary Advisors will be announced soon');
      expectNoChinese(main);
    });

    it("shows an advisor's own title in the advisors' list, which reads it as a credential, with no office line added, on every page that lists them", async () => {
      await seedPeople();
      test.d1.exec("UPDATE people SET title_en = 'PhD in Computer Science at University of Toronto' WHERE id = 'advisor'");
      const credential = '<p class="person__title">PhD in Computer Science at University of Toronto</p><p class="person__affiliation">University of Toronto</p>';
      for (const path of ['/people', '/people/advisors', '/']) {
        const main = mainOf(await render(path));
        const start = main.indexOf('<ul class="people-grid people-grid--advisors');
        expect(start, path).toBeGreaterThan(0);
        const list = main.slice(start, main.indexOf('</ul>', start));
        expect(list, path).toContain(credential);
        expect(list, path).not.toContain('Honorary Advisor');
      }
    });
  });

  describe('person page', () => {
    async function respond(path: string): Promise<Response> {
      const ctx = testExecutionContext();
      const response = await app.request(path, {}, test.env, ctx);
      await ctx.settle();
      return response;
    }

    it('shows the bio, affiliation and contact links in English, with the way back to the Presidium', async () => {
      await seedPeople();
      const html = await render('/people/president');
      const main = mainOf(html);
      expect(main).toContain('<a class="backlink" href="/people/presidium">');
      expect(main).toContain('<div class="eyebrow">President</div>');
      expect(main).toContain('<h1 class="page-hero__title">Wang Hui</h1>');
      expect(main).not.toContain('page-hero__lead');
      expect(main).toContain(`<img class="profile__photo" src="${mediaUrl(PHOTO_KEY)}" alt="Wang Hui"`);
      expect(main).toContain('<p class="profile__affiliation">Computer Science, Year 3</p>');
      expect(main).toContain('<div class="prose profile__bio"><p>First paragraph.</p><p>Second paragraph.</p></div>');
      expect(main).toContain('href="mailto:wang@example.com"');
      expect(main).toContain('href="https://example.com/wang" rel="noopener noreferrer" target="_blank"');
      expectNoChinese(main);
      expect(html).toContain('<title>Wang Hui · UTMMSC Mandarin Scholars Coalition 国语学者联盟</title>');
      expect(html).toContain('<meta name="description" content="President · Computer Science, Year 3"/>');
      expect(html).toContain(`<meta property="og:image" content="https://utmmsc.com${mediaUrl(PHOTO_KEY)}"/>`);
    });

    it('leads back to the page that lists each group, and draws a missing photo as the large monogram', async () => {
      await seedPeople();
      const advisor = mainOf(await render('/people/advisor'));
      expect(advisor).toContain('<a class="backlink" href="/people/advisors">');
      expect(advisor).toContain('<p class="profile__affiliation">University of Toronto</p>');
      expect(advisor).toContain('<div class="profile__photo person__monogram" aria-hidden="true">PC</div>');
      expect(advisor).not.toContain('class="person"');
      expectNoChinese(advisor);

      const head = mainOf(await render('/people/head-academic'));
      expect(head).toContain('<a class="backlink" href="/people/departments">');
      expect(head).toContain('<div class="eyebrow">Head of Academic and Reviews</div>');
      expectNoChinese(head);
    });

    it('escapes the name and finds nobody hidden, unknown or malformed', async () => {
      await seedPeople();
      const html = await render('/people/finance');
      expect(html).not.toContain(SCRIPT_NAME);
      expect(html).toContain('<h1 class="page-hero__title" lang="zh-CN">&lt;script&gt;alert(1)&lt;/script&gt;</h1>');
      expect((await respond('/people/advisor-hidden')).status).toBe(404);
      expect((await respond('/people/nobody')).status).toBe(404);
      expect((await respond('/people/bad.id')).status).toBe(404);
    });

    it('moves an old English address to the page at the root', async () => {
      const response = await respond('/en/people/president');
      expect(response.status).toBe(301);
      expect(new URL(response.headers.get('location') ?? '', 'https://utmmsc.com').pathname).toBe('/people/president');
    });
  });

  describe('navigation', () => {
    it('reaches a single group only from the header dropdown, which marks the open group and its parent', async () => {
      const groups = { '/people/advisors': 'Honorary Advisors', '/people/presidium': 'Presidium', '/people/departments': 'Department Leads' };
      for (const [path, label] of Object.entries(groups)) {
        const html = await render(path);
        expect(html, path).toContain('<a class="site-nav__link site-nav__link--parent" href="/people" aria-current="true">');
        expect(html.match(/<a class="site-nav__menu-link"[^>]*aria-current="page">[^<]*<\/a>/g), path).toEqual([
          `<a class="site-nav__menu-link" href="${path}" aria-current="page">${label}</a>`,
        ]);
        const main = mainOf(html);
        expect(main, path).not.toContain('class="tabs"');
        expect(main, path).not.toContain('class="backlink"');
        expect(main, path).not.toMatch(/href="\/people(\/(advisors|presidium|departments))?"/);
      }
    });

    it('offers the dropdown on every page in the order /people lists the groups, in English only, and in the phone menu', async () => {
      const html = await render('/events');
      const people = html.slice(html.indexOf('<a class="site-nav__link site-nav__link--parent" href="/people"'));
      const menu = people.slice(people.indexOf('<div class="site-nav__panel">'));
      const order = ['/people/advisors', '/people/presidium', '/people/departments'].map((href) => menu.indexOf(`href="${href}"`));
      expect(order.every((index) => index >= 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      expect(menu.slice(0, menu.indexOf('</div>'))).not.toMatch(/[一-鿿]/);
      expect(html).toContain('<div class="mobile-nav__sub">');
      expect(occurrences(html, 'href="/people/departments"')).toBe(2);
    });

    it('marks Our People itself as the current page on /people, which has no tabs or group links either', async () => {
      const html = await render('/people');
      expect(html).toContain('<a class="site-nav__link site-nav__link--parent" href="/people" aria-current="page">');
      expect(html).not.toMatch(/class="site-nav__menu-link" href="[^"]*" aria-current=/);
      const main = mainOf(html);
      expect(main).not.toContain('class="tabs"');
      expect(main).not.toContain('class="backlink"');
      expect(main).not.toMatch(/href="\/people(\/(advisors|presidium|departments))?"/);
    });
  });
});
