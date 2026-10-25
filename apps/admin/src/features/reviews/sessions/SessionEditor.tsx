import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DELIVERY_MODES,
  DELIVERY_MODE_LABELS,
  EXAM_KINDS,
  EXAM_KIND_LABELS,
  SESSION_LIMITS,
  pickText,
  sessionHeading,
  termLabel,
  torontoWallTime,
  wallDateOf,
  type Course,
  type PublishStatus,
  type ReviewSession,
  type ReviewSessionDetail,
} from '@msc-web/content';
import { coursesApi, reviewSessionsApi } from '../../../shared/api/endpoints';
import { SaveFeedback } from '../../../shared/feedback/SaveFeedback';
import type { ActionFailure } from '../../../shared/feedback/notices';
import { useArrivalNotice, withNotice } from '../../../shared/feedback/useArrivalNotice';
import { useFlash } from '../../../shared/feedback/useFlash';
import { issuesOf } from '../../../shared/forms/issues';
import { Button } from '../../../shared/ui/Button';
import { LocalizedInput, Select, TextInput, WallTimeInput } from '../../../shared/ui/fields';
import { FormActions, PageHeader, Panel } from '../../../shared/ui/layout';
import { MaterialsPanel } from '../materials/MaterialsPanel';
import { StatusBadge } from './SessionBadges';
import { sessionDraftOf, sessionInputOf, termChoices, type SessionDraft } from './session-draft';

const EXAM_OPTIONS = EXAM_KINDS.map((exam) => ({ value: exam, label: EXAM_KIND_LABELS[exam].zh }));

const MODE_OPTIONS = DELIVERY_MODES.map((mode) => ({ value: mode, label: DELIVERY_MODE_LABELS[mode].zh }));

const STATUS_OPTIONS: readonly { value: PublishStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '发布' },
];

const START_HINT = '多伦多时间；留空则网站显示“时间待定”';

const END_HINT = '多伦多时间，可不填；留空时只显示开始时间';

/**
 * The form for one review session of a course. Materials can be attached only once the session is saved, because
 * they belong to a stored session.
 * 某门课程中一场复习的表单。资料只能在场次保存后添加，因为资料属于已保存的场次。
 */
export function SessionEditor({ course, session, onReload }: { course: Course; session: ReviewSessionDetail | null; onReload: () => void }) {
  const navigate = useNavigate();
  const { flash, showFlash, clearFlash } = useFlash(useArrivalNotice());
  const [today] = useState(() => wallDateOf(torontoWallTime(new Date())));
  const [record, setRecord] = useState<ReviewSession | null>(session);
  const [draft, setDraft] = useState(() => sessionDraftOf(session, today));
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [failure, setFailure] = useState<ActionFailure | null>(null);
  const issues = issuesOf(failure?.error);
  const termOptions = useMemo(() => termChoices(today, record?.term ?? null).map((term) => ({ value: term, label: termLabel(term).zh })), [today, record]);
  const courseTitle = pickText(course.title, 'zh');
  const courseLink = `/reviews/courses/${course.id}`;

  const update = (patch: Partial<SessionDraft>) => setDraft((current) => ({ ...current, ...patch }));

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy('save');
    setFailure(null);
    clearFlash();
    try {
      const input = sessionInputOf(draft);
      if (!record) {
        const { session: created } = await coursesApi.addSession(course.id, input);
        navigate(`/reviews/sessions/${created.id}`, { replace: true, state: withNotice('复习场次已创建，现在可以添加资料') });
        return;
      }
      const { session: updated } = await reviewSessionsApi.update(record.id, input, record.updatedAt);
      setRecord(updated);
      setDraft(sessionDraftOf(updated, today));
      showFlash('已保存');
    } catch (error) {
      setFailure({ action: 'save', error });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!record) return;
    if (!window.confirm('确定删除这场复习吗？其中的所有资料也会一并删除，且无法恢复。')) return;
    setBusy('delete');
    setFailure(null);
    clearFlash();
    try {
      await reviewSessionsApi.remove(record.id);
      navigate(courseLink, { replace: true, state: withNotice('复习场次已删除') });
    } catch (error) {
      setFailure({ action: 'delete', error });
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        back={{ to: courseLink, label: `返回课程 ${course.code}` }}
        title={record ? `${termLabel(record.term).zh} · ${sessionHeading(record).zh}` : '新增复习场次'}
        description={
          <>
            <span className="font-mono font-semibold text-brand-800">{course.code}</span>
            {courseTitle && ` · ${courseTitle}`}
          </>
        }
        actions={record && <StatusBadge status={record.status} />}
      />
      <form noValidate onSubmit={(event) => void save(event)}>
        <fieldset disabled={busy !== null} className="min-w-0 space-y-6">
          <Panel title="基本信息">
            <div className="grid gap-4 sm:grid-cols-3">
              <Select label="学期" value={draft.term} onChange={(term) => update({ term })} options={termOptions} issues={issues} field="term" required />
              <Select label="复习类型" value={draft.exam} onChange={(exam) => update({ exam })} options={EXAM_OPTIONS} issues={issues} field="exam" required />
              <Select label="发布状态" value={draft.status} onChange={(status) => update({ status })} options={STATUS_OPTIONS} issues={issues} field="status" hint="草稿不会出现在网站上" required />
            </div>
            <LocalizedInput label="副标题" value={draft.title} onChange={(title) => update({ title })} issues={issues} field="title" maxLength={SESSION_LIMITS.title} hint="例如 第 1-5 章，可不填" />
          </Panel>

          <Panel title="时间与地点">
            <div className="grid gap-4 sm:grid-cols-2">
              <WallTimeInput label="开始时间" value={draft.startsAt} onChange={(startsAt) => update({ startsAt })} issues={issues} field="startsAt" hint={START_HINT} />
              <WallTimeInput label="结束时间" value={draft.endsAt} onChange={(endsAt) => update({ endsAt })} issues={issues} field="endsAt" hint={END_HINT} />
            </div>
            {(draft.startsAt || draft.endsAt) && (
              <Button variant="ghost" size="sm" onClick={() => update({ startsAt: '', endsAt: '' })}>
                清空时间，改为时间待定
              </Button>
            )}
            <Select label="上课方式" value={draft.mode} onChange={(mode) => update({ mode })} options={MODE_OPTIONS} issues={issues} field="mode" required className="sm:max-w-xs" />
            <LocalizedInput label="地点" value={draft.location} onChange={(location) => update({ location })} issues={issues} field="location" maxLength={SESSION_LIMITS.location} hint="例如 DV 2074 或 Zoom 会议" />
            <TextInput
              label="主讲人"
              value={draft.presenters}
              onChange={(presenters) => update({ presenters })}
              issues={issues}
              field="presenters"
              maxLength={SESSION_LIMITS.presenters}
              hint="多位主讲人写在同一行，例如 张三、李四"
            />
          </Panel>

          <Panel title="报名、回放与说明">
            <TextInput
              label="报名链接"
              type="url"
              value={draft.registrationUrl}
              onChange={(registrationUrl) => update({ registrationUrl })}
              issues={issues}
              field="registrationUrl"
              placeholder="https://"
              hint="留空则网站不显示报名按钮"
            />
            <TextInput
              label="回放链接"
              type="url"
              value={draft.recordingUrl}
              onChange={(recordingUrl) => update({ recordingUrl })}
              issues={issues}
              field="recordingUrl"
              placeholder="https://"
              hint="复习结束后可填写录播地址"
            />
            <LocalizedInput label="说明" value={draft.notes} onChange={(notes) => update({ notes })} issues={issues} field="notes" multiline maxLength={SESSION_LIMITS.notes} hint="例如需要提前准备的内容" />
          </Panel>
        </fieldset>

        <FormActions status={<SaveFeedback failure={failure} flash={flash} onReload={onReload} />}>
          {record && (
            <Button variant="danger" busy={busy === 'delete'} disabled={busy !== null} onClick={() => void remove()}>
              删除场次
            </Button>
          )}
          <Button type="submit" busy={busy === 'save'} disabled={busy !== null}>
            {record ? '保存' : '创建场次'}
          </Button>
        </FormActions>
      </form>

      {session && <MaterialsPanel sessionId={session.id} initialMaterials={session.materials} className="mt-6" />}
    </>
  );
}
