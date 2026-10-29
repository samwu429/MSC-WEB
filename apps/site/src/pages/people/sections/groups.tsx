import {
  DEPARTMENT_DESCRIPTIONS,
  DEPARTMENT_LABELS,
  DEPARTMENT_POSITION_LABELS,
  defaultPositionTitle,
  hasText,
  type DepartmentPosition,
  type Locale,
  type LocalizedText,
  type Person,
} from '@msc-web/content';
import { EmptyState, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { PersonCard, VacantPersonCard, type CardHeadingLevel } from '../PersonCard';
import type { PeopleRoster } from '../roster';
import { PEOPLE } from '../strings';

/*
 * The people of each group, shared by the group's own page (entries under the page h1) and by /people, where each
 * group sits under its own h2; the Honorary Advisors also appear on the home page.
 * 各团体的成员，由该团体自己的页面（条目位于页面 h1 之下）与 /people（每个团体位于自己的 h2 之下）共用；荣誉顾问也显示在首页。
 */

/**
 * The visible Honorary Advisors as portraits in a centred row, so two advisors sit as a pair in the middle rather
 * than at the start of an empty row; or a note that they will be announced.
 * 正在显示的荣誉顾问，以肖像居中排成一行，两位顾问因此并排居中，而不是挤在空行的开头；尚无人时显示即将公布的说明。
 */
export function AdvisorCards(props: { advisors: readonly Person[]; locale: Locale; headingLevel: CardHeadingLevel }) {
  const { advisors, locale, headingLevel } = props;
  if (advisors.length === 0) return <EmptyState title={t(PEOPLE, 'advisorsEmptyTitle', locale)} text={t(PEOPLE, 'advisorsEmptyText', locale)} />;
  return (
    <ul class="portraits" role="list">
      {advisors.map((person) => (
        <PersonCard person={person} locale={locale} layout="portrait" headingLevel={headingLevel} />
      ))}
    </ul>
  );
}

/**
 * A lead's role inside the Department's own block, which already names the Department: "Head" or "Vice Head", unless
 * the lead has a title of their own.
 * 负责人在部门区块内的职务，区块已写明部门名称："Head" 或 "Vice Head"；负责人有自定义头衔时使用该头衔。
 */
function roleInDepartment(person: Person, position: DepartmentPosition): LocalizedText {
  return hasText(person.title) ? person.title : DEPARTMENT_POSITION_LABELS[position];
}

/**
 * One Department: its name over a rule, its leads as compact rows (the Head, or a quiet "to be announced" line,
 * before visible Vice Heads), then its remit. The block has no fill, so one with fewer leads simply ends sooner.
 * 一个部门：名称及其下方的细线，负责人以紧凑行列出（部长或一行安静的 "待公布" 在正在显示的副部长之前），最后是职能。
 * 区块没有底色，负责人较少的区块只是更早结束，不会留下空白色块。
 */
function DepartmentBlock(props: { entry: PeopleRoster['departments'][number]; locale: Locale; nameLevel: 2 | 3 }) {
  const { entry, locale } = props;
  const headingId = `dept-${entry.department}`;
  const Name = props.nameLevel === 2 ? 'h2' : 'h3';
  const leadLevel: CardHeadingLevel = props.nameLevel === 2 ? 3 : 4;
  return (
    <article class="department" aria-labelledby={headingId}>
      <Name class="department__name" id={headingId}>
        {txt(DEPARTMENT_LABELS[entry.department], locale)}
      </Name>
      <div class="department__body">
        <ul class="department__leads" role="list">
          {entry.heads.length > 0 ? (
            entry.heads.map((person) => (
              <PersonCard person={person} locale={locale} layout="row" headingLevel={leadLevel} title={roleInDepartment(person, 'head')} />
            ))
          ) : (
            <VacantPersonCard
              title={txt(defaultPositionTitle('head', entry.department), locale)}
              label={txt(DEPARTMENT_POSITION_LABELS.head, locale)}
              locale={locale}
              layout="row"
              headingLevel={leadLevel}
            />
          )}
          {entry.viceHeads.map((person) => (
            <PersonCard person={person} locale={locale} layout="row" headingLevel={leadLevel} title={roleInDepartment(person, 'vice_head')} />
          ))}
        </ul>
        <p class="department__remit">{txt(DEPARTMENT_DESCRIPTIONS[entry.department], locale)}</p>
      </div>
    </article>
  );
}

/**
 * The five Departments in constitution order as an even grid of blocks whose names line up across a row; names are
 * h2 on their own page, h3 on /people.
 * 按章程顺序排列的五个部门，组成均匀的区块网格，同一行中各区块的名称彼此对齐；部门名称在其自己的页面上为 h2，在 /people 上为 h3。
 */
export function DepartmentBlocks(props: { departments: PeopleRoster['departments']; locale: Locale; nameLevel: 2 | 3 }) {
  return (
    <div class="departments">
      {props.departments.map((entry) => (
        <DepartmentBlock entry={entry} locale={props.locale} nameLevel={props.nameLevel} />
      ))}
    </div>
  );
}
