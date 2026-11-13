import { defaultPositionTitle, type Locale, type Person } from '@msc-web/content';
import { Icon } from '../../components/Icon';
import { EmptyState, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { ABOUT_DEPARTMENTS_PATH, sitePath } from '../../routing/paths';
import { PersonTiles, Vacancies, type CardHeadingLevel } from '../PersonCard';
import type { PeopleRoster } from '../roster';
import { PEOPLE } from '../strings';

/*
 * The people of each group, shared by the group's own page (names under the page h1) and by /people, where each
 * group sits under its own h2; the Honorary Advisors also appear on the home page. Every group uses the same tiles.
 * 各团体的成员，由该团体自己的页面（姓名位于页面 h1 之下）与 /people（每个团体位于自己的 h2 之下）共用；荣誉顾问也显示在首页。
 * 各团体使用相同的方块。
 */

/**
 * The visible Honorary Advisors as a centred row of tiles, or a note that they will be announced. An advisor's title,
 * such as "PhD in Computer Science at University of Toronto", reads as a quiet credential rather than an office,
 * because the group's heading already says they are Honorary Advisors. On the home page the row starts at the left,
 * under the section's left-aligned heading.
 * 正在显示的荣誉顾问，以方块居中排成一行；尚无人时显示即将公布的说明。顾问的头衔（例如 "PhD in Computer Science at University of
 * Toronto"）显示为低调的资历说明，而不是职位，因为团体标题已写明他们是荣誉顾问。在首页上，这一行从左侧开始，位于板块左对齐的标题之下。
 */
export function AdvisorCards(props: { advisors: readonly Person[]; locale: Locale; headingLevel: CardHeadingLevel; alignStart?: boolean }) {
  const { advisors, locale, headingLevel } = props;
  if (advisors.length === 0) return <EmptyState title={t(PEOPLE, 'advisorsEmptyTitle', locale)} text={t(PEOPLE, 'advisorsEmptyText', locale)} />;
  return (
    <PersonTiles
      people={advisors}
      locale={locale}
      headingLevel={headingLevel}
      class={props.alignStart ? 'people-grid--advisors people-grid--start' : 'people-grid--advisors'}
    />
  );
}

/**
 * The leads of the five Departments as one row of tiles in constitution order: each Department's Head, then its Vice
 * Heads. Each tile's title names the Department, such as "Head of Technology". A Department without a Head adds one
 * quiet line under the row. What each Department does is on the About page, behind DepartmentsMoreLink.
 * 五个部门的负责人按章程顺序排成一行方块：每个部门先是部长，然后是副部长。每个方块的头衔写明所属部门，例如 "Head of Technology"。
 * 没有部长的部门在这一行下方占一行安静的文字。各部门的职能在关于页面上，由 DepartmentsMoreLink 链接过去。
 */
export function DepartmentLeads(props: { departments: PeopleRoster['departments']; locale: Locale; headingLevel: CardHeadingLevel }) {
  const { departments, locale, headingLevel } = props;
  const leads = departments.flatMap((entry) => [...entry.heads, ...entry.viceHeads]);
  const vacant = departments.filter((entry) => entry.heads.length === 0).map((entry) => txt(defaultPositionTitle('head', entry.department), locale));
  return (
    <>
      <PersonTiles people={leads} locale={locale} headingLevel={headingLevel} />
      <Vacancies offices={vacant} locale={locale} />
    </>
  );
}

/**
 * The one quiet link from the Department Leads to the About page's outline of what each Department does: under the
 * group's lead on /people, and in the hero of the group's own page.
 * 从部长团通往关于页面中各部门职能介绍的唯一一个低调链接：位于 /people 中该团体导语之下，以及该团体自己页面的页首中。
 */
export function DepartmentsMoreLink(props: { locale: Locale }) {
  return (
    <p class="section-more">
      <a class="link-arrow" href={sitePath(ABOUT_DEPARTMENTS_PATH)}>
        {t(PEOPLE, 'departmentsMore', props.locale)}
        <Icon name="arrow" />
      </a>
    </p>
  );
}
