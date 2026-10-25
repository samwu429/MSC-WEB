import {
  DEPARTMENTS,
  DEPARTMENT_DESCRIPTIONS,
  DEPARTMENT_LABELS,
  PEOPLE_SECTION_LABELS,
  PRESIDIUM_POSITIONS,
  PRESIDIUM_POSITION_DUTIES,
  PRESIDIUM_POSITION_LABELS,
  type LocalizedText,
} from '@msc-web/content';
import type { PageContext } from '../../context';
import { SectionHeading, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { SECTION_PATHS, localePath } from '../../routing/paths';
import { ABOUT } from '../strings';

function UnitGroup(props: { id: string; title: string; text: string; units: { name: LocalizedText; text: LocalizedText }[]; ctx: PageContext }) {
  const { locale } = props.ctx;
  return (
    <div class="dept" role="group" aria-labelledby={props.id}>
      <div class="dept__head">
        <h3 class="dept__name" id={props.id}>
          {props.title}
        </h3>
        <p class="dept__text">{props.text}</p>
      </div>
      <div class="dept__people">
        {props.units.map((unit) => (
          <div class="pillar">
            <h4 class="pillar__title">{txt(unit.name, locale)}</h4>
            <p class="pillar__text">{txt(unit.text, locale)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The structure of Article 4 at a glance: the four Presidium offices with their duties and the five Departments
 * with their remits. Who holds each office is on the Our People page.
 * 一览章程第四条规定的结构：四个主席团职位及其职责、五个部门及其职能。各职位的担任者见 "我们的团队" 页面。
 */
export function OrganisationSection({ ctx }: { ctx: PageContext }) {
  const { locale } = ctx;
  return (
    <section class="section" aria-labelledby="about-organisation">
      <div class="container">
        <SectionHeading
          id="about-organisation"
          eyebrow={t(ABOUT, 'organisationEyebrow', locale)}
          title={t(ABOUT, 'organisationTitle', locale)}
          lead={t(ABOUT, 'organisationLead', locale)}
          link={{ href: localePath(locale, SECTION_PATHS.people), label: t(ABOUT, 'organisationLink', locale) }}
        />
        <UnitGroup
          id="about-presidium"
          title={txt(PEOPLE_SECTION_LABELS.presidium, locale)}
          text={t(ABOUT, 'presidiumText', locale)}
          units={PRESIDIUM_POSITIONS.map((position) => ({ name: PRESIDIUM_POSITION_LABELS[position], text: PRESIDIUM_POSITION_DUTIES[position] }))}
          ctx={ctx}
        />
        <UnitGroup
          id="about-departments"
          title={t(ABOUT, 'departmentsTitle', locale)}
          text={t(ABOUT, 'departmentsText', locale)}
          units={DEPARTMENTS.map((department) => ({ name: DEPARTMENT_LABELS[department], text: DEPARTMENT_DESCRIPTIONS[department] }))}
          ctx={ctx}
        />
      </div>
    </section>
  );
}
