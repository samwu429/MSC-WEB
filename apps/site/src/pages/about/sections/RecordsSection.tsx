import { DOCUMENT_CATEGORY_LABELS, formatLongDate, mediaUrl, type SiteDocument } from '@msc-web/content';
import type { PageContext } from '../../context';
import { Icon } from '../../components/Icon';
import { EmptyState, SectionHeading, fallbackLang, txt } from '../../components/common';
import { t } from '../../i18n/strings';
import { groupDocuments } from '../document-groups';
import { ABOUT } from '../strings';

/** The public records the constitution requires (Articles 11.3 and 13.7), grouped by category, each a PDF link. */
/** 章程要求公开的记录（第 11.3 条与第 13.7 条），按类别分组，每份记录都是一个 PDF 链接。 */
export function RecordsSection({ ctx, documents }: { ctx: PageContext; documents: SiteDocument[] }) {
  const { locale } = ctx;
  const groups = groupDocuments(documents);
  return (
    <section class="section section--alt" aria-labelledby="about-records">
      <div class="container">
        <SectionHeading
          id="about-records"
          eyebrow={t(ABOUT, 'recordsEyebrow', locale)}
          title={t(ABOUT, 'recordsTitle', locale)}
          lead={t(ABOUT, 'recordsLead', locale)}
        />
        {groups.length > 0 ? (
          groups.map((group) => (
            <div class="doc-group">
              <h3>{txt(DOCUMENT_CATEGORY_LABELS[group.category], locale)}</h3>
              <ul class="doc-list">
                {group.documents.map((document) => (
                  <li class="doc-item">
                    <span class="doc-item__icon">
                      <Icon name="file" />
                    </span>
                    <span class="doc-item__body">
                      <a class="doc-item__title" href={mediaUrl(document.mediaKey)} type="application/pdf" lang={fallbackLang(document.title, locale)}>
                        {txt(document.title, locale)}
                      </a>
                      <span class="doc-item__meta">
                        {formatLongDate(document.publishedOn, locale)} · {t(ABOUT, 'pdf', locale)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <EmptyState title={t(ABOUT, 'recordsEmptyTitle', locale)} text={t(ABOUT, 'recordsEmptyText', locale)} />
        )}
      </div>
    </section>
  );
}
