import { isSafeHttpUrl } from '@msc-web/content';
import type { PageContext } from '../../context';
import { Icon, type IconName } from '../../components/Icon';
import { Bi, BiText, SectionHeading, type Copy } from '../../components/common';
import { t } from '../../i18n/strings';
import { SECTION_PATHS, sitePath, withQuery } from '../../routing/paths';
import { HOME } from '../strings';

interface Pillar {
  icon: IconName;
  title: Copy;
  text: Copy;
  link: { href: string; label: string; external: boolean } | null;
}

/**
 * The four areas of work from the constitution. Each links to the site page that covers it; technology projects
 * link to the GitHub organization when the editors have entered its address.
 * 章程规定的四项工作。每一项都链接到网站上对应的页面；技术项目在编辑者填写了 GitHub 组织地址时链接到该地址。
 */
export function PillarsSection({ ctx }: { ctx: PageContext }) {
  const { locale } = ctx;
  const githubUrl = ctx.settings.contact.githubUrl;
  const eventsPath = sitePath(SECTION_PATHS.events);
  const pillars: Pillar[] = [
    {
      icon: 'note',
      title: HOME.pillarReviewsTitle,
      text: HOME.pillarReviewsText,
      link: { href: sitePath(SECTION_PATHS.reviews), label: t(HOME, 'pillarReviewsLink', locale), external: false },
    },
    {
      icon: 'cap',
      title: HOME.pillarAcademicTitle,
      text: HOME.pillarAcademicText,
      link: { href: withQuery(eventsPath, { type: 'academic' }), label: t(HOME, 'pillarAcademicLink', locale), external: false },
    },
    {
      icon: 'users',
      title: HOME.pillarExtracurricularTitle,
      text: HOME.pillarExtracurricularText,
      link: { href: withQuery(eventsPath, { type: 'extracurricular' }), label: t(HOME, 'pillarExtracurricularLink', locale), external: false },
    },
    {
      icon: 'code',
      title: HOME.pillarTechnologyTitle,
      text: HOME.pillarTechnologyText,
      link: githubUrl && isSafeHttpUrl(githubUrl) ? { href: githubUrl, label: t(HOME, 'pillarTechnologyLink', locale), external: true } : null,
    },
  ];

  return (
    <section class="section" aria-labelledby="home-pillars">
      <div class="container">
        <SectionHeading
          id="home-pillars"
          eyebrow={t(HOME, 'pillarsEyebrow', locale)}
          title={HOME.pillarsTitle}
          lead={HOME.pillarsLead}
        />
        <div class="pillars">
          {pillars.map((pillar) => (
            <article class="pillar">
              <div class="pillar__icon">
                <Icon name={pillar.icon} />
              </div>
              <h3 class="pillar__title">
                <Bi text={pillar.title} />
              </h3>
              <BiText text={pillar.text} class="pillar__text" />
              {pillar.link && (
                <p class="pillar__text">
                  <a
                    class="link-arrow"
                    href={pillar.link.href}
                    rel={pillar.link.external ? 'noopener noreferrer' : undefined}
                    target={pillar.link.external ? '_blank' : undefined}
                  >
                    {pillar.link.label}
                    <Icon name={pillar.link.external ? 'external' : 'arrow'} />
                  </a>
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
