import { listVisibleDocuments } from '../../../../infrastructure/d1/public/documents';
import { AboutPage } from '../../../../pages/about/AboutPage';
import { txt } from '../../../../pages/components/common';
import { loadPageContext } from '../../../../pages/context';
import { COMMON, t } from '../../../../pages/i18n/strings';
import { renderPage } from '../../../../pages/render';
import type { PageHandler } from '../page-handler';

/** The opening paragraph of the mission, as one line for the meta description. */
/** 宗旨的第一段，合并为一行，用作页面描述。 */
function firstParagraph(text: string): string {
  return (text.trim().split(/\n\s*\n/)[0] ?? '').replace(/\s+/g, ' ');
}

export const aboutPage: PageHandler = async (c, locale) => {
  const [ctx, documents] = await Promise.all([loadPageContext(c, locale), listVisibleDocuments(c.env.DB)]);
  return renderPage(
    c,
    ctx,
    { title: t(COMMON, 'navAbout', locale), description: firstParagraph(txt(ctx.settings.about.mission, locale)) },
    <AboutPage ctx={ctx} documents={documents} />,
  );
};
