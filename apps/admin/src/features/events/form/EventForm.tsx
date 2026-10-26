import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { EVENT_LIMITS, pickText, type EventInput, type SiteEvent } from '@msc-web/content';
import { eventsApi } from '../../../shared/api/endpoints';
import { ActionFailedNotice, FAILED_ACTION_LABELS, type ActionFailure, type FormAction } from '../../../shared/feedback/notices';
import { useArrivalNotice, withNotice } from '../../../shared/feedback/useArrivalNotice';
import { useFlash } from '../../../shared/feedback/useFlash';
import { issuesOf } from '../../../shared/forms/issues';
import { sameValue, submitOnSaveShortcut, useUnsavedChanges } from '../../../shared/forms/unsaved';
import { ImageField } from '../../../shared/media/MediaFields';
import { UPLOADING_STATUS, useUploadsInProgress } from '../../../shared/media/useUploadsInProgress';
import { Button, buttonClass } from '../../../shared/ui/Button';
import { useConfirm } from '../../../shared/ui/confirm';
import { Notice } from '../../../shared/ui/feedback';
import { LocalizedInput, Select, TextInput, WallTimeInput } from '../../../shared/ui/fields';
import { FormActions, Panel } from '../../../shared/ui/layout';
import { CATEGORY_OPTIONS, STATUS_OPTIONS, emptyEventInput, publicEventPath, toEventInput } from './event-form';

/**
 * The editor for one event's own fields. The public link follows the last saved record rather than the form, so
 * it never points at a slug or status that has not been saved yet.
 * 单个活动自身字段的编辑器。公开链接依据最近保存的记录而非表单内容，因此永远不会指向尚未保存的链接名或状态。
 */
export function EventForm(props: { event: SiteEvent | null; onReload: () => void }) {
  const { onReload } = props;
  const navigate = useNavigate();
  const { flash, showFlash, clearFlash } = useFlash(useArrivalNotice());
  const { uploading, onBusyChange } = useUploadsInProgress();
  const [saved, setSaved] = useState<SiteEvent | null>(props.event);
  const [initial] = useState<EventInput>(() => (props.event ? toEventInput(props.event) : emptyEventInput()));
  const [value, setValue] = useState<EventInput>(initial);
  const [baseline, setBaseline] = useState<EventInput>(initial);
  const dirty = !sameValue(value, baseline);
  const { allowNavigation, dialog } = useUnsavedChanges(dirty);
  const confirm = useConfirm();
  const [busy, setBusy] = useState<FormAction | null>(null);
  const [failure, setFailure] = useState<ActionFailure | null>(null);
  const issues = issuesOf(failure?.error);

  // Updates are functional because a cover upload finishes after other fields may have changed.
  // 采用函数式更新，因为封面上传完成时其他字段可能已被修改。
  function change(patch: Partial<EventInput>) {
    setValue((current) => ({ ...current, ...patch }));
    clearFlash();
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy('save');
    setFailure(null);
    clearFlash();
    try {
      if (!saved) {
        const { event: createdEvent } = await eventsApi.create(value);
        allowNavigation();
        navigate(`/events/${createdEvent.id}`, { replace: true, state: withNotice('活动已创建，现在可以添加活动照片') });
        return;
      }
      const { event: updated } = await eventsApi.update(saved.id, value, saved.updatedAt);
      setValue(toEventInput(updated));
      setBaseline(toEventInput(updated));
      setSaved(updated);
      showFlash('已保存');
    } catch (error) {
      setFailure({ action: 'save', error });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!saved) return;
    const title = pickText(saved.title, 'zh') || '这个活动';
    const confirmed = await confirm({ title: `删除活动「${title}」？`, message: '活动的照片会一并删除，删除后无法恢复。', confirmLabel: '删除活动', tone: 'danger' });
    if (!confirmed) return;
    setBusy('delete');
    setFailure(null);
    clearFlash();
    try {
      await eventsApi.remove(saved.id);
      allowNavigation();
      navigate('/events', { replace: true });
    } catch (error) {
      setFailure({ action: 'delete', error });
      setBusy(null);
    }
  }

  const viewLink =
    saved?.status === 'published' ? (
      <a href={publicEventPath(saved.slug)} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm')}>
        在网站上查看
      </a>
    ) : undefined;

  const status = uploading ? (
    UPLOADING_STATUS
  ) : flash ? (
    <Notice tone="success">{flash}</Notice>
  ) : failure ? (
    <span className="font-medium text-red-700">{FAILED_ACTION_LABELS[failure.action]}，请查看页面上方的提示</span>
  ) : null;

  return (
    <form noValidate onSubmit={(event) => void save(event)} onKeyDown={submitOnSaveShortcut}>
      {dialog}
      <fieldset disabled={busy !== null} className="min-w-0 space-y-6">
        {failure && <ActionFailedNotice action={failure.action} error={failure.error} onReload={onReload} />}

        <Panel title="活动内容">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="类别"
              value={value.category}
              options={CATEGORY_OPTIONS}
              onChange={(category) => change({ category })}
              issues={issues}
              field="category"
              required
            />
          </div>
          <LocalizedInput
            label="标题"
            value={value.title}
            onChange={(title) => change({ title })}
            issues={issues}
            field="title"
            required
            maxLength={EVENT_LIMITS.title}
          />
          <LocalizedInput
            label="简介"
            value={value.summary}
            onChange={(summary) => change({ summary })}
            issues={issues}
            field="summary"
            multiline
            rows={3}
            maxLength={EVENT_LIMITS.summary}
            hint="一两句话，显示在活动卡片上。"
          />
          <LocalizedInput
            label="正文"
            value={value.body}
            onChange={(body) => change({ body })}
            issues={issues}
            field="body"
            multiline
            rows={12}
            maxLength={EVENT_LIMITS.body}
            hint="空一行即开始新的段落；网址会自动变成链接。"
          />
        </Panel>

        <Panel title="时间与地点">
          <div className="grid gap-4 sm:grid-cols-2">
            <WallTimeInput
              label="开始时间"
              value={value.startsAt}
              onChange={(startsAt) => change({ startsAt })}
              issues={issues}
              field="startsAt"
              required
            />
            <WallTimeInput
              label="结束时间"
              value={value.endsAt ?? ''}
              onChange={(endsAt) => change({ endsAt: endsAt || null })}
              issues={issues}
              field="endsAt"
              hint="多伦多时间，可不填"
            />
          </div>
          <LocalizedInput
            label="地点"
            value={value.location}
            onChange={(location) => change({ location })}
            issues={issues}
            field="location"
            maxLength={EVENT_LIMITS.location}
          />
        </Panel>

        <Panel title="封面与报名">
          <ImageField
            label="封面图片"
            value={value.coverKey}
            onChange={(coverKey) => change({ coverKey })}
            onBusyChange={onBusyChange}
            issues={issues}
            field="coverKey"
            aspect="aspect-video"
          />
          <TextInput
            label="报名链接"
            type="url"
            value={value.registrationUrl ?? ''}
            onChange={(registrationUrl) => change({ registrationUrl: registrationUrl || null })}
            issues={issues}
            field="registrationUrl"
            placeholder="https://"
            hint="例如报名表单的网址，可不填"
          />
        </Panel>

        <Panel title="发布" actions={viewLink}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="状态"
              value={value.status}
              options={STATUS_OPTIONS}
              onChange={(status) => change({ status })}
              issues={issues}
              field="status"
              hint="草稿只在后台可见"
              required
            />
            <TextInput
              label="链接名"
              value={value.slug}
              onChange={(slug) => change({ slug })}
              issues={issues}
              field="slug"
              placeholder="2026-10-mid-autumn-night"
              autoComplete="off"
              hint={
                saved
                  ? `网站地址：${publicEventPath(saved.slug)}。留空则保留当前链接名；发布后修改会使已分享的链接失效。`
                  : '只能使用小写字母、数字和连字符。留空则根据英文标题和日期自动生成。'
              }
            />
          </div>
        </Panel>
      </fieldset>

      <FormActions status={status} dirty={dirty}>
        {saved && (
          <Button variant="danger" busy={busy === 'delete'} disabled={busy !== null} onClick={() => void remove()}>
            删除
          </Button>
        )}
        <Button type="submit" busy={busy === 'save'} disabled={busy !== null || uploading}>
          {saved ? '保存' : '创建'}
        </Button>
      </FormActions>
    </form>
  );
}
