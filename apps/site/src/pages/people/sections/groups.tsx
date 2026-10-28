import { DEPARTMENT_DESCRIPTIONS, DEPARTMENT_LABELS, defaultPositionTitle, type Locale } from '@msc-web/content';
import { EmptyState, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { PersonCard, VacantPersonCard, type CardHeadingLevel } from '../PersonCard';
import type { PeopleRoster } from '../roster';
import { PEOPLE } from '../strings';

/*
 * The people of each group, shared by the group's own page (cards under the page h1) and by /people, where each
 * group sits under its own h2.
 * 各团体的成员，由该团体自己的页面（卡片位于页面 h1 之下）与 /people（每个团体位于自己的 h2 之下）共用。
 */

/** The visible Honorary Advisors, or a note that they will be announced. */
/** 正在显示的荣誉顾问；尚无人时显示即将公布的说明。 */
export function AdvisorCards(props: { roster: PeopleRoster; locale: Locale; headingLevel: CardHeadingLevel }) {
  const { roster, locale, headingLevel } = props;
  if (roster.advisors.length === 0) return <EmptyState title={t(PEOPLE, 'advisorsEmptyTitle', locale)} text={t(PEOPLE, 'advisorsEmptyText', locale)} />;
  return (
    <div class="people-grid">
      {roster.advisors.map((person) => (
        <PersonCard person={person} locale={locale} headingLevel={headingLevel} />
      ))}
    </div>
  );
}

/** One Department: its name and remit, the Head or a vacant Head card, then visible Vice Heads. */
/** 一个部门：名称与职能、部长或空缺的部长卡片，然后是正在显示的副部长。 */
function DepartmentBlock(props: { entry: PeopleRoster['departments'][number]; locale: Locale; nameLevel: 2 | 3 }) {
  const { entry, locale } = props;
  const headingId = `dept-${entry.department}`;
  const Name = props.nameLevel === 2 ? 'h2' : 'h3';
  const cardLevel: CardHeadingLevel = props.nameLevel === 2 ? 3 : 4;
  return (
    <article class="dept" aria-labelledby={headingId}>
      <div class="dept__head">
        <Name class="dept__name" id={headingId}>
          {txt(DEPARTMENT_LABELS[entry.department], locale)}
        </Name>
        <p class="dept__text">{txt(DEPARTMENT_DESCRIPTIONS[entry.department], locale)}</p>
      </div>
      <div class="dept__people">
        {entry.heads.length > 0 ? (
          entry.heads.map((person) => <PersonCard person={person} locale={locale} headingLevel={cardLevel} />)
        ) : (
          <VacantPersonCard title={txt(defaultPositionTitle('head', entry.department), locale)} locale={locale} headingLevel={cardLevel} />
        )}
        {entry.viceHeads.map((person) => (
          <PersonCard person={person} locale={locale} headingLevel={cardLevel} />
        ))}
      </div>
    </article>
  );
}

/** The five Departments in constitution order with their Heads and Vice Heads; names are h2 on their own page, h3 on /people. */
/** 按章程顺序排列的五个部门及其部长与副部长；部门名称在其自己的页面上为 h2，在 /people 上为 h3。 */
export function DepartmentBlocks(props: { roster: PeopleRoster; locale: Locale; nameLevel: 2 | 3 }) {
  return (
    <>
      {props.roster.departments.map((entry) => (
        <DepartmentBlock entry={entry} locale={props.locale} nameLevel={props.nameLevel} />
      ))}
    </>
  );
}
