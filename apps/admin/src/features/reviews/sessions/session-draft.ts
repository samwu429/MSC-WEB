import {
  compareTerms,
  emptyText,
  nearbyTerms,
  termOfDate,
  type DeliveryMode,
  type ExamKind,
  type LocalizedText,
  type PublishStatus,
  type ReviewSession,
  type ReviewSessionInput,
  type TermKey,
  type WallDate,
} from '@msc-web/content';

/**
 * The session form's state. Times and links stay plain strings while editing, and an empty string means "none".
 * 复习场次表单的状态。编辑期间时间与链接都保持为普通字符串，空字符串表示未填写。
 */
export interface SessionDraft {
  term: TermKey;
  exam: ExamKind;
  status: PublishStatus;
  title: LocalizedText;
  startsAt: string;
  endsAt: string;
  mode: DeliveryMode;
  location: LocalizedText;
  presenters: string;
  registrationUrl: string;
  recordingUrl: string;
  notes: LocalizedText;
}

/** A saved session as a draft, or a new draft in the term of today's Toronto date. */
/** 将已保存的场次转为草稿；新建时为多伦多今天所在学期的空白草稿。 */
export function sessionDraftOf(session: ReviewSession | null, today: WallDate): SessionDraft {
  if (!session) {
    return {
      term: termOfDate(today),
      exam: 'midterm',
      status: 'draft',
      title: emptyText(),
      startsAt: '',
      endsAt: '',
      mode: 'in_person',
      location: emptyText(),
      presenters: '',
      registrationUrl: '',
      recordingUrl: '',
      notes: emptyText(),
    };
  }
  return {
    term: session.term,
    exam: session.exam,
    status: session.status,
    title: session.title,
    startsAt: session.startsAt ?? '',
    endsAt: session.endsAt ?? '',
    mode: session.mode,
    location: session.location,
    presenters: session.presenters,
    registrationUrl: session.registrationUrl ?? '',
    recordingUrl: session.recordingUrl ?? '',
    notes: session.notes,
  };
}

export function sessionInputOf(draft: SessionDraft): ReviewSessionInput {
  return {
    ...draft,
    startsAt: draft.startsAt || null,
    endsAt: draft.endsAt || null,
    registrationUrl: draft.registrationUrl.trim() || null,
    recordingUrl: draft.recordingUrl.trim() || null,
  };
}

/**
 * The terms the picker offers, oldest first: those around today, plus the session's saved term when it lies
 * outside that window, so opening an old session never moves it to another term on save.
 * 学期选择器提供的学期，按时间先后排列：今天前后的学期，以及不在其中的场次已保存学期，打开旧场次再保存时因此不会被移到其他学期。
 */
export function termChoices(today: WallDate, savedTerm: TermKey | null): TermKey[] {
  const terms = nearbyTerms(today);
  if (savedTerm && !terms.includes(savedTerm)) terms.push(savedTerm);
  return terms.sort(compareTerms);
}
