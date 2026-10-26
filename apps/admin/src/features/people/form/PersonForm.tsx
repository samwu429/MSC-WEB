import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS, PERSON_LIMITS, defaultPositionTitle, pickText, type PeopleSection, type Person, type PersonInput } from '@msc-web/content';
import { peopleApi } from '../../../shared/api/endpoints';
import { ActionFailedNotice, FAILED_ACTION_LABELS, type ActionFailure, type FormAction } from '../../../shared/feedback/notices';
import { useArrivalNotice, withNotice } from '../../../shared/feedback/useArrivalNotice';
import { useFlash } from '../../../shared/feedback/useFlash';
import { issuesOf } from '../../../shared/forms/issues';
import { sameValue, submitOnSaveShortcut, useUnsavedChanges } from '../../../shared/forms/unsaved';
import { useConfirm } from '../../../shared/ui/confirm';
import { ImageField } from '../../../shared/media/MediaFields';
import { UPLOADING_STATUS, useUploadsInProgress } from '../../../shared/media/useUploadsInProgress';
import { Button } from '../../../shared/ui/Button';
import { Notice } from '../../../shared/ui/feedback';
import { Checkbox, LocalizedInput, NumberInput, Select, TextInput } from '../../../shared/ui/fields';
import { FormActions, Panel } from '../../../shared/ui/layout';
import { DEPARTMENT_OPTIONS, SECTION_OPTIONS, positionOptions, toPersonInput, withSection } from './person-form';

/**
 * The editor for one person. It keeps the version it last loaded or saved and sends it with every update, so a
 * save made elsewhere in the meantime is reported instead of silently overwritten.
 * 单个成员的编辑器。它保存最近一次加载或保存得到的版本，并随每次更新一起发送；其间若有他人保存，会提示冲突而不是悄悄覆盖。
 */
export function PersonForm(props: { person: Person | null; defaults: PersonInput; onReload: () => void }) {
  const { onReload } = props;
  const navigate = useNavigate();
  const { flash, showFlash, clearFlash } = useFlash(useArrivalNotice());
  const { uploading, onBusyChange } = useUploadsInProgress();
  const [saved, setSaved] = useState<Person | null>(props.person);
  const [initial] = useState<PersonInput>(() => (props.person ? toPersonInput(props.person) : props.defaults));
  const [value, setValue] = useState<PersonInput>(initial);
  const [baseline, setBaseline] = useState<PersonInput>(initial);
  const dirty = !sameValue(value, baseline);
  const { allowNavigation, dialog } = useUnsavedChanges(dirty);
  const confirm = useConfirm();
  const [busy, setBusy] = useState<FormAction | null>(null);
  const [failure, setFailure] = useState<ActionFailure | null>(null);
  const issues = issuesOf(failure?.error);
  const positions = positionOptions(value.section);
  const fallbackTitle = defaultPositionTitle(value.position, value.department);

  // Updates are functional because a photo upload finishes after other fields may have changed.
  // 采用函数式更新，因为照片上传完成时其他字段可能已被修改。
  function change(patch: Partial<PersonInput>) {
    setValue((current) => ({ ...current, ...patch }));
    clearFlash();
  }

  function changeSection(section: PeopleSection) {
    setValue((current) => withSection(current, section));
    clearFlash();
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy('save');
    setFailure(null);
    clearFlash();
    try {
      if (!saved) {
        const { person: createdPerson } = await peopleApi.create(value);
        allowNavigation();
        navigate(`/people/${createdPerson.id}`, { replace: true, state: withNotice('成员已添加') });
        return;
      }
      const { person: updated } = await peopleApi.update(saved.id, value, saved.updatedAt);
      setValue(toPersonInput(updated));
      setBaseline(toPersonInput(updated));
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
    const name = pickText(saved.name, 'zh') || '这位成员';
    const confirmed = await confirm({
      title: `删除「${name}」？`,
      message: '删除后无法恢复。如果只是卸任，可以改为取消勾选「在网站上显示」。',
      confirmLabel: '删除成员',
      tone: 'danger',
    });
    if (!confirmed) return;
    setBusy('delete');
    setFailure(null);
    clearFlash();
    try {
      await peopleApi.remove(saved.id);
      allowNavigation();
      navigate('/people', { replace: true });
    } catch (error) {
      setFailure({ action: 'delete', error });
      setBusy(null);
    }
  }

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

        <Panel title="职位" description="每个主席团职位和每个部门的部长同一时间只能有一人显示在网站上；换届时请先隐藏或删除上一任。">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="分组" value={value.section} options={SECTION_OPTIONS} onChange={changeSection} issues={issues} field="section" required />
            {positions.length > 0 && (
              <Select
                label="职位"
                value={value.position}
                options={positions}
                onChange={(position) => change({ position })}
                issues={issues}
                field="position"
                required
              />
            )}
            {value.section === 'department' && (
              <Select
                label="部门"
                value={value.department ?? DEPARTMENTS[0]}
                options={DEPARTMENT_OPTIONS}
                onChange={(department) => change({ department })}
                issues={issues}
                field="department"
                required
              />
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberInput
              label="排序"
              value={value.sortOrder}
              onChange={(sortOrder) => change({ sortOrder })}
              issues={issues}
              field="sortOrder"
              min={0}
              max={9999}
              hint="同一职位中数字小的排在前面"
            />
          </div>
          <Checkbox label="在网站上显示" checked={value.visible} onChange={(visible) => change({ visible })} hint="隐藏的成员只保留在后台，不会出现在网站上。" />
        </Panel>

        <Panel title="姓名与介绍" description="「我们的团队」在网站上只显示英文，请务必填写英文；中文只用于后台识别。">
          <LocalizedInput
            label="姓名"
            value={value.name}
            onChange={(name) => change({ name })}
            issues={issues}
            field="name"
            required
            maxLength={PERSON_LIMITS.name}
          />
          <LocalizedInput
            label="头衔"
            value={value.title}
            onChange={(title) => change({ title })}
            issues={issues}
            field="title"
            maxLength={PERSON_LIMITS.title}
            hint={`留空时显示职位名称：${fallbackTitle.zh} / ${fallbackTitle.en}`}
          />
          <LocalizedInput
            label="专业或单位"
            value={value.affiliation}
            onChange={(affiliation) => change({ affiliation })}
            issues={issues}
            field="affiliation"
            maxLength={PERSON_LIMITS.affiliation}
            hint="学生填写专业与年级，荣誉顾问填写职位与单位。"
          />
          <LocalizedInput
            label="简介"
            value={value.bio}
            onChange={(bio) => change({ bio })}
            issues={issues}
            field="bio"
            multiline
            rows={5}
            maxLength={PERSON_LIMITS.bio}
          />
        </Panel>

        <Panel title="照片与联系方式">
          <ImageField
            label="照片"
            value={value.photoKey}
            onChange={(photoKey) => change({ photoKey })}
            onBusyChange={onBusyChange}
            issues={issues}
            field="photoKey"
            aspect="aspect-[4/5]"
            hint="竖版照片效果最好。支持 JPG、PNG、WebP，上传前会自动压缩。"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="邮箱"
              type="email"
              value={value.email ?? ''}
              onChange={(email) => change({ email: email || null })}
              issues={issues}
              field="email"
              autoComplete="off"
            />
            <TextInput
              label="个人链接"
              type="url"
              value={value.linkUrl ?? ''}
              onChange={(linkUrl) => change({ linkUrl: linkUrl || null })}
              issues={issues}
              field="linkUrl"
              placeholder="https://"
              hint="例如领英或个人主页"
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
