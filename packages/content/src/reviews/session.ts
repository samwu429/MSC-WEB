import type { LocalizedText } from '../locale/locale';
import { PUBLISH_STATUSES, type PublishStatus } from '../publishing/status';
import type { WallTime } from '../time/toronto';
import { IssueCollector, asRecord, type ValidationResult } from '../validation/issues';
import {
  checkTimeOrder,
  readEnum,
  readLocalizedText,
  readOptionalUrl,
  readOptionalWallTime,
  readText,
} from '../validation/fields';
import { isTermKey, type TermKey } from './terms';
import type { ReviewMaterial } from './material';

/** Each course gets a midterm review and a final review per term, and a term may hold more than one of each. */
/** 每门课每学期都有期中复习与期末复习，同一学期内每种复习可以有多场。 */
export const EXAM_KINDS = ['midterm', 'final'] as const;

export type ExamKind = (typeof EXAM_KINDS)[number];

export const EXAM_KIND_LABELS: Record<ExamKind, LocalizedText> = {
  midterm: { zh: '期中复习', en: 'Midterm Review' },
  final: { zh: '期末复习', en: 'Final Review' },
};

export const DELIVERY_MODES = ['in_person', 'online', 'hybrid'] as const;

export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, LocalizedText> = {
  in_person: { zh: '线下', en: 'In person' },
  online: { zh: '线上', en: 'Online' },
  hybrid: { zh: '线上线下同步', en: 'Hybrid' },
};

export interface ReviewSession {
  id: string;
  courseId: string;
  term: TermKey;
  exam: ExamKind;
  status: PublishStatus;
  /** Optional subtitle such as "Chapters 1-5"; empty uses the exam label. */
  /** 可选的副标题，例如 "第 1-5 章"；留空时使用复习类型名称。 */
  title: LocalizedText;
  /** Null while the date is still being arranged; the public page then says "time to be announced". */
  /** 时间尚在安排时为空；公开页面显示 "时间待定"。 */
  startsAt: WallTime | null;
  endsAt: WallTime | null;
  mode: DeliveryMode;
  location: LocalizedText;
  /** Names of the tutors leading the session, as one line. */
  /** 主讲同学的姓名，写成一行。 */
  presenters: string;
  registrationUrl: string | null;
  recordingUrl: string | null;
  notes: LocalizedText;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSessionDetail extends ReviewSession {
  materials: ReviewMaterial[];
}

export type ReviewSessionInput = Omit<ReviewSession, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>;

export const SESSION_LIMITS = {
  title: 120,
  location: 120,
  presenters: 200,
  notes: 2000,
} as const;

export function validateReviewSessionInput(raw: unknown): ValidationResult<ReviewSessionInput> {
  const issues = new IssueCollector();
  const body = asRecord(raw);
  let term: TermKey = '2000-fall';
  if (isTermKey(body.term)) term = body.term;
  else issues.add('term', '请选择学期');
  const startsAt = readOptionalWallTime(issues, body.startsAt, 'startsAt', '开始时间');
  const endsAt = readOptionalWallTime(issues, body.endsAt, 'endsAt', '结束时间');
  if (endsAt && !startsAt) issues.add('startsAt', '填写结束时间前请先填写开始时间');
  checkTimeOrder(issues, startsAt, endsAt, 'endsAt');
  const value: ReviewSessionInput = {
    term,
    exam: readEnum(issues, body.exam, 'exam', EXAM_KINDS, '复习类型'),
    status: readEnum(issues, body.status, 'status', PUBLISH_STATUSES, '发布状态'),
    title: readLocalizedText(issues, body.title, 'title', { label: '副标题', max: SESSION_LIMITS.title }),
    startsAt,
    endsAt,
    mode: readEnum(issues, body.mode, 'mode', DELIVERY_MODES, '上课方式'),
    location: readLocalizedText(issues, body.location, 'location', { label: '地点', max: SESSION_LIMITS.location }),
    presenters: readText(issues, body.presenters, 'presenters', { label: '主讲人', max: SESSION_LIMITS.presenters }),
    registrationUrl: readOptionalUrl(issues, body.registrationUrl, 'registrationUrl', { label: '报名链接' }),
    recordingUrl: readOptionalUrl(issues, body.recordingUrl, 'recordingUrl', { label: '回放链接' }),
    notes: readLocalizedText(issues, body.notes, 'notes', { label: '说明', max: SESSION_LIMITS.notes, multiline: true }),
  };
  return issues.result(value);
}

/** The heading of a session: the exam label, followed by the subtitle in either language when there is one. */
/** 复习场次的标题：复习类型名称，若有副标题（任一语言）则接在后面。 */
export function sessionHeading(session: Pick<ReviewSession, 'exam' | 'title'>): LocalizedText {
  const exam = EXAM_KIND_LABELS[session.exam];
  const zh = session.title.zh || session.title.en;
  const en = session.title.en || session.title.zh;
  return {
    zh: zh ? `${exam.zh} · ${zh}` : exam.zh,
    en: en ? `${exam.en} · ${en}` : exam.en,
  };
}
