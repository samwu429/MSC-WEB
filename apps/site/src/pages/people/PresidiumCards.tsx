import { PRESIDIUM_POSITION_DUTIES, PRESIDIUM_POSITION_LABELS, type Locale } from '@msc-web/content';
import { txt } from '../components/common';
import { PersonCard, VacantPersonCard, type CardHeadingLevel } from './PersonCard';
import type { PeopleRoster } from './roster';

/**
 * The four Presidium offices in order, as seats of equal size that each name their office: the holder with a small
 * photo, or, while the office is vacant, a quiet slot that says what the office does.
 * 按顺序排列的四个主席团职位，每个职位是大小相同、写明职位名称的一席：担任者附小照片；职位空缺时是一个安静的色块，写明该职位的职责。
 */
export function PresidiumCards(props: { presidium: PeopleRoster['presidium']; locale: Locale; headingLevel?: CardHeadingLevel }) {
  const { locale, headingLevel } = props;
  return (
    <ul class="offices" role="list">
      {props.presidium.map((office) =>
        office.holders.length > 0 ? (
          office.holders.map((person) => <PersonCard person={person} locale={locale} layout="seat" headingLevel={headingLevel} />)
        ) : (
          <VacantPersonCard
            title={txt(PRESIDIUM_POSITION_LABELS[office.position], locale)}
            duties={txt(PRESIDIUM_POSITION_DUTIES[office.position], locale)}
            locale={locale}
            layout="seat"
            headingLevel={headingLevel}
          />
        ),
      )}
    </ul>
  );
}
