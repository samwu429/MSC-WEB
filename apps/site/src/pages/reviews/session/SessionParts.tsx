import {
  DELIVERY_MODE_LABELS,
  formatTimeRange,
  sessionHeading,
  timeStatus,
  type ExamKind,
  type Locale,
  type ReviewSession,
  type ReviewSessionDetail,
} from '@msc-web/content';
import type { PageContext } from '../../context';
import { StatusChip, fallbackLang, txt } from '../../components/common';
import { Icon } from '../../components/Icon';
import { COMMON, t } from '../../i18n/strings';
import { EXAM_CHIP_LABELS, REVIEWS, materialsCount } from '../strings';

/**
 * Pieces of a review session shared by course cards and the course page, so a session reads the same wherever it
 * appears.
 * 课程卡片与课程页面共用的复习场次组件，使同一场复习在各处的呈现保持一致。
 */

/** The fragment id of a session on its course page, which course cards link to. */
/** 场次在课程页面上的锚点 id，课程卡片会链接到这里。 */
export function sessionAnchor(session: Pick<ReviewSession, 'id'>): string {
  return `session-${session.id}`;
}

export function ExamChip({ exam, locale }: { exam: ExamKind; locale: Locale }) {
  return <span class={`chip chip--${exam}`}>{txt(EXAM_CHIP_LABELS[exam], locale)}</span>;
}

/**
 * "10月25日 周日 18:30–20:30 · 线下 · IB 110", or the TBA text in place of the time while none is set. The location
 * is editor text, so it carries its own lang when it is shown in the other language.
 * "10月25日 周日 18:30–20:30 · 线下 · IB 110"；尚未设定时间时以 "时间待定" 代替时间。地点是编辑者的文字，
 * 以另一种语言显示时带有自己的 lang 属性。
 */
export function SessionWhen({ session, ctx }: { session: ReviewSession; ctx: PageContext }) {
  const { locale } = ctx;
  const time = session.startsAt ? formatTimeRange(session.startsAt, session.endsAt, locale, ctx.currentYear) : t(COMMON, 'timeTba', locale);
  const location = txt(session.location, locale);
  return (
    <p class="session-row__when">
      {`${time} · ${txt(DELIVERY_MODE_LABELS[session.mode], locale)}`}
      {location && (
        <>
          {' · '}
          <span lang={fallbackLang(session.location, locale)}>{location}</span>
        </>
      )}
    </p>
  );
}

/**
 * Exam chip, heading and status. The status chip is left out while the time is still to be announced, because the
 * line below already says so. With `headingId` the heading is an h3 that its block can be labelled by.
 * 复习类型标签、标题与状态。时间待定时不显示状态标签，因为下一行已经写明。提供 `headingId` 时标题为 h3，可供所在区块引用为标签。
 */
export function SessionLabel({ session, ctx, headingId }: { session: ReviewSession; ctx: PageContext; headingId?: string }) {
  const { locale } = ctx;
  const status = timeStatus(session.startsAt, session.endsAt, ctx.now);
  const heading = txt(sessionHeading(session), locale);
  return (
    <div class="session-row__label">
      <ExamChip exam={session.exam} locale={locale} />
      {headingId ? <h3 id={headingId}>{heading}</h3> : <span>{heading}</span>}
      {status !== 'tba' && <StatusChip status={status} locale={locale} />}
    </div>
  );
}

/**
 * Register until the session ends, a materials link when `materialsHref` is given and there are materials, and the
 * recording when one is published.
 * 场次结束前显示报名；提供 `materialsHref` 且有资料时显示资料链接；发布了回放时显示回放链接。
 */
export function SessionActions({ session, ctx, materialsHref }: { session: ReviewSessionDetail; ctx: PageContext; materialsHref?: string }) {
  const { locale } = ctx;
  const registrationUrl = timeStatus(session.startsAt, session.endsAt, ctx.now) === 'past' ? null : session.registrationUrl;
  const showMaterials = materialsHref !== undefined && session.materials.length > 0;
  if (!registrationUrl && !showMaterials && !session.recordingUrl) return null;
  return (
    <div class="session-row__actions">
      {registrationUrl && (
        <a class="btn btn--primary btn--small" href={registrationUrl} target="_blank" rel="noopener noreferrer">
          {t(COMMON, 'register', locale)}
        </a>
      )}
      {showMaterials && (
        <a class="btn btn--ghost btn--small" href={materialsHref}>
          <Icon name="file" />
          {materialsCount(session.materials.length, locale)}
        </a>
      )}
      {session.recordingUrl && (
        <a class="btn btn--ghost btn--small" href={session.recordingUrl} target="_blank" rel="noopener noreferrer">
          <Icon name="video" />
          {t(REVIEWS, 'recording', locale)}
        </a>
      )}
    </div>
  );
}
