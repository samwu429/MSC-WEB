import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { COURSE_LIMITS, courseSlug, pickText, type Course, type CourseInput, type CourseResponse } from '@msc-web/content';
import { coursesApi } from '../../../shared/api/endpoints';
import { SaveFeedback } from '../../../shared/feedback/SaveFeedback';
import type { ActionFailure } from '../../../shared/feedback/notices';
import { useArrivalNotice, withNotice } from '../../../shared/feedback/useArrivalNotice';
import { useFlash } from '../../../shared/feedback/useFlash';
import { issuesOf } from '../../../shared/forms/issues';
import { Button, buttonClass } from '../../../shared/ui/Button';
import { Checkbox, LocalizedInput, NumberInput, TextInput } from '../../../shared/ui/fields';
import { FormActions, PageHeader, Panel } from '../../../shared/ui/layout';
import { CourseSessionsPanel } from './CourseSessionsPanel';
import { courseDraftOf, courseInputOf } from './course-draft';

/**
 * The form for one course, and for a saved course the list of its review sessions.
 * 单门课程的表单；已保存的课程还会列出它的复习场次。
 */
export function CourseEditor({ loaded, onReload }: { loaded: CourseResponse | null; onReload: () => void }) {
  const navigate = useNavigate();
  const { flash, showFlash, clearFlash } = useFlash(useArrivalNotice());
  const [record, setRecord] = useState<Course | null>(loaded?.course ?? null);
  const [draft, setDraft] = useState(() => courseDraftOf(record));
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [failure, setFailure] = useState<ActionFailure | null>(null);
  const issues = issuesOf(failure?.error);

  const update = (patch: Partial<CourseInput>) => setDraft((current) => ({ ...current, ...patch }));

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy('save');
    setFailure(null);
    clearFlash();
    try {
      const input = courseInputOf(draft);
      if (!record) {
        const { course } = await coursesApi.create(input);
        navigate(`/reviews/courses/${course.id}`, { replace: true, state: withNotice('课程已创建，现在可以添加复习场次') });
        return;
      }
      const { course } = await coursesApi.update(record.id, input, record.updatedAt);
      setRecord(course);
      setDraft(courseDraftOf(course));
      showFlash('已保存');
    } catch (error) {
      setFailure({ action: 'save', error });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!record) return;
    if (!window.confirm(`确定删除课程 ${record.code} 吗？它的所有复习场次和资料都会一并删除，且无法恢复。`)) return;
    setBusy('delete');
    setFailure(null);
    clearFlash();
    try {
      await coursesApi.remove(record.id);
      navigate('/reviews', { replace: true, state: withNotice(`课程 ${record.code} 已删除`) });
    } catch (error) {
      setFailure({ action: 'delete', error });
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        back={{ to: '/reviews', label: '全部课程' }}
        title={record ? record.code : '新增课程'}
        description={record ? pickText(record.title, 'zh') : '先保存课程，再为它添加各学期的复习场次。'}
        actions={
          record && (
            <a href={`/reviews/${courseSlug(record.code)}`} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm')}>
              在网站上查看
            </a>
          )
        }
      />
      <form noValidate onSubmit={(event) => void save(event)}>
        <fieldset disabled={busy !== null} className="min-w-0 space-y-6">
          <Panel title="课程信息">
            <TextInput
              label="课程代码"
              value={draft.code}
              onChange={(code) => update({ code: code.toUpperCase() })}
              issues={issues}
              field="code"
              required
              maxLength={16}
              autoComplete="off"
              hint="如 CSC108H5 或 MAT135"
              className="sm:max-w-xs"
            />
            <LocalizedInput label="课程名称" value={draft.title} onChange={(title) => update({ title })} issues={issues} field="title" required maxLength={COURSE_LIMITS.title} />
            <LocalizedInput
              label="课程说明"
              value={draft.description}
              onChange={(description) => update({ description })}
              issues={issues}
              field="description"
              multiline
              rows={3}
              maxLength={COURSE_LIMITS.description}
              hint="显示在网站的课程页面上，可不填"
            />
          </Panel>

          <Panel title="显示设置">
            <NumberInput label="排序" value={draft.sortOrder} onChange={(sortOrder) => update({ sortOrder })} issues={issues} field="sortOrder" min={0} max={9999} hint="数字越小越靠前" className="sm:max-w-xs" />
            <Checkbox label="在网站上显示" checked={draft.visible} onChange={(visible) => update({ visible })} hint="取消勾选后，这门课程及其所有复习场次都不会出现在网站上" />
          </Panel>
        </fieldset>

        <FormActions status={<SaveFeedback failure={failure} flash={flash} onReload={onReload} />}>
          {record && (
            <Button variant="danger" busy={busy === 'delete'} disabled={busy !== null} onClick={() => void remove()}>
              删除课程
            </Button>
          )}
          <Button type="submit" busy={busy === 'save'} disabled={busy !== null}>
            {record ? '保存' : '创建课程'}
          </Button>
        </FormActions>
      </form>

      {record && <CourseSessionsPanel course={record} sessions={loaded?.sessions ?? []} className="mt-6" />}
    </>
  );
}
