import { defaultPositionTitle, type Locale } from '@msc-web/content';
import { txt } from '../components/common';
import { PersonTiles, Vacancies, type CardHeadingLevel } from './PersonCard';
import type { PeopleRoster } from './roster';

/**
 * The four Presidium offices in order: the holders as tiles, each titled with their office, then one quiet line for
 * each office that is vacant.
 * 按顺序排列的四个主席团职位：担任者以方块显示，各自写明职位；每个空缺的职位在下方占一行安静的文字。
 */
export function PresidiumCards(props: { presidium: PeopleRoster['presidium']; locale: Locale; headingLevel: CardHeadingLevel }) {
  const { presidium, locale, headingLevel } = props;
  const holders = presidium.flatMap((office) => office.holders);
  const vacant = presidium.filter((office) => office.holders.length === 0).map((office) => txt(defaultPositionTitle(office.position, null), locale));
  return (
    <>
      <PersonTiles people={holders} locale={locale} headingLevel={headingLevel} />
      <Vacancies offices={vacant} locale={locale} />
    </>
  );
}
