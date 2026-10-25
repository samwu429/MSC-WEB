import { useId, useState, type FormEvent } from 'react';
import { MATERIAL_KINDS, MATERIAL_KIND_LABELS, MATERIAL_LIMITS, type ReviewMaterial } from '@msc-web/content';
import { reviewSessionsApi } from '../../../shared/api/endpoints';
import { errorMessage, issuesOf } from '../../../shared/forms/issues';
import { DocumentField } from '../../../shared/media/MediaFields';
import { UPLOADING_STATUS, useUploadsInProgress } from '../../../shared/media/useUploadsInProgress';
import { Button } from '../../../shared/ui/Button';
import { Notice } from '../../../shared/ui/feedback';
import { LocalizedInput, NumberInput, Select, TextInput } from '../../../shared/ui/fields';
import { issuesForSource, materialDraftOf, materialInputOf, type MaterialDraft, type MaterialSource } from './material-draft';

const KIND_OPTIONS = MATERIAL_KINDS.map((kind) => ({ value: kind, label: MATERIAL_KIND_LABELS[kind].zh }));

const SOURCE_OPTIONS: readonly { value: MaterialSource; label: string }[] = [
  { value: 'upload', label: '上传 PDF' },
  { value: 'link', label: '填写链接' },
];

function SourcePicker({ value, onChange }: { value: MaterialSource; onChange: (source: MaterialSource) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-ink">
        资料来源
        <span className="ml-2 text-xs font-normal text-ink-muted">文件与链接二选一</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {SOURCE_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold ${
                selected ? 'border-brand-700 text-brand-800 ring-2 ring-brand-200' : 'border-line-strong text-ink-soft hover:border-brand-700'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 border-line-strong text-brand-700 focus:ring-brand-200"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Adds a material to a saved session or edits one. The panel that opens it refreshes its list after a save.
 * 为已保存的复习场次添加资料或编辑资料。打开它的面板会在保存后刷新列表。
 */
export function MaterialForm(props: {
  sessionId: string;
  material: ReviewMaterial | null;
  existing: readonly ReviewMaterial[];
  onSaved: (material: ReviewMaterial) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => materialDraftOf(props.material, props.existing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const { uploading, onBusyChange } = useUploadsInProgress();
  const issues = issuesForSource(issuesOf(error), draft.source);

  const update = (patch: Partial<MaterialDraft>) => setDraft((current) => ({ ...current, ...patch }));

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input = materialInputOf(draft);
      const { material } = props.material
        ? await reviewSessionsApi.updateMaterial(props.sessionId, props.material.id, input)
        : await reviewSessionsApi.addMaterial(props.sessionId, input);
      props.onSaved(material);
    } catch (failure) {
      setError(failure);
      setSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={(event) => void save(event)} className="space-y-5 rounded-lg border border-brand-200 bg-brand-50/40 p-4 sm:p-5">
      <h3 className="text-sm font-bold text-brand-900">{props.material ? '编辑资料' : '添加资料'}</h3>
      {error !== null && <Notice tone="error">{errorMessage(error)}</Notice>}
      <fieldset disabled={saving} className="min-w-0 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="资料类型" value={draft.kind} onChange={(kind) => update({ kind })} options={KIND_OPTIONS} issues={issues} field="kind" required />
          <NumberInput label="排序" value={draft.sortOrder} onChange={(sortOrder) => update({ sortOrder })} issues={issues} field="sortOrder" min={0} max={9999} hint="数字越小越靠前" />
        </div>
        <LocalizedInput label="资料名称" value={draft.label} onChange={(label) => update({ label })} issues={issues} field="label" maxLength={MATERIAL_LIMITS.label} hint="两种语言都留空时显示资料类型名称" />
        <SourcePicker value={draft.source} onChange={(source) => update({ source })} />
        {draft.source === 'upload' ? (
          <DocumentField label="PDF 文件" value={draft.mediaKey} onChange={(mediaKey) => update({ mediaKey })} onBusyChange={onBusyChange} issues={issues} field="mediaKey" required />
        ) : (
          <TextInput
            label="资料链接"
            type="url"
            value={draft.url}
            onChange={(url) => update({ url })}
            issues={issues}
            field="url"
            required
            placeholder="https://"
            hint="例如共享文件夹或在线文档的链接"
          />
        )}
      </fieldset>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {uploading && <span className="text-sm text-ink-muted">{UPLOADING_STATUS}</span>}
        <Button variant="ghost" disabled={saving} onClick={props.onCancel}>
          取消
        </Button>
        <Button type="submit" busy={saving} disabled={uploading}>
          保存资料
        </Button>
      </div>
    </form>
  );
}
