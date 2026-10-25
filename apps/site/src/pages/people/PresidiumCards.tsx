import { PRESIDIUM_POSITION_DUTIES, PRESIDIUM_POSITION_LABELS, type Locale } from '@msc-web/content';
import { txt } from '../components/common';
import { PersonCard, VacantPersonCard, type CardHeadingLevel } from './PersonCard';
import type { PeopleRoster } from './roster';

/**
 * The four Presidium offices in order, each with its holder or a vacant card. The Presidium page shows the duties
 * of a vacant office; the compact home page preview leaves duties and bios out.
 * 按顺序排列的四个主席团职位，每个职位显示担任者或空缺卡片。主席团页面会显示空缺职位的职责；首页的精简预览省略职责与简介。
 */
export function PresidiumCards(props: { presidium: PeopleRoster['presidium']; locale: Locale; compact?: boolean; headingLevel?: CardHeadingLevel }) {
  const { locale, headingLevel } = props;
  return (
    <div class="people-grid">
      {props.presidium.map((office) =>
        office.holders.length > 0 ? (
          office.holders.map((person) => <PersonCard person={person} locale={locale} compact={props.compact} headingLevel={headingLevel} />)
        ) : (
          <VacantPersonCard
            title={txt(PRESIDIUM_POSITION_LABELS[office.position], locale)}
            duties={props.compact ? undefined : txt(PRESIDIUM_POSITION_DUTIES[office.position], locale)}
            locale={locale}
            headingLevel={headingLevel}
          />
        ),
      )}
    </div>
  );
}
