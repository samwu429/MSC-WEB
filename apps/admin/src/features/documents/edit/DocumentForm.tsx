import { useState, type FormEvent } from 'react';
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, DOCUMENT_LIMITS, pickText, type SiteDocument, type SiteDocumentInput } from '@msc-web/content';
import { documentsApi } from '../../../shared/api/endpoints';
import { ActionFailedNotice, type ActionFailure } from '../../../shared/feedback/notices';
import { useArrivalNotice } from '../../../shared/feedback/useArrivalNotice';
import { useFlash } from '../../../shared/feedback/useFlash';
import { issuesOf } from '../../../shared/forms/issues';
import { DocumentField } from '../../../shared/media/MediaFields';
import { UPLOADING_STATUS, useUploadsInProgress } from '../../../shared/media/useUploadsInProgress';
import { Button } from '../../../shared/ui/Button';
import { Notice } from '../../../shared/ui/feedback';
import { Checkbox, DateInput, LocalizedInput, NumberInput, Select } from '../../../shared/ui/fields';
import { FormActions, Panel } from '../../../shared/ui/layout';
import { documentInputOf, newDocumentInput } from './document-input';

const CATEGORY_OPTIONS = DOCUMENT_CATEGORIES.map((category) => ({ value: category, label: DOCUMENT_CATEGORY_LABELS[category].zh }));

export interface DocumentFormProps {
  /** The stored document, or null when creating one. */
  /** 已保存的文件；新建时为空。 */
  document: SiteDocument | null;
  onCreated: (document: SiteDocument) => void;
  onDeleted: () => void;
  onReload: () => void;
}

export function DocumentForm({ document, onCreated, onDeleted, onReload }: DocumentFormProps) {
  const { flash, showFlash, clearFlash } = useFlash(useArrivalNotice());
  const { uploading, onBusyChange } = useUploadsInProgress();
  const [value, setValue] = useState<SiteDocumentInput>(() => (document ? documentInputOf(document) : newDocumentInput(new Date())));
  const [updatedAt, setUpdatedAt] = useState(document?.updatedAt ?? '');
  const [busy, setBusy] = useState<'saving' | 'deleting' | null>(null);
  const [failure, setFailure] = useState<ActionFailure | null>(null);
  const issues = issuesOf(failure?.error);

  function change(patch: Partial<SiteDocumentInput>) {
    setValue((current) => ({ ...current, ...patch }));
    clearFlash();
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy('saving');
    setFailure(null);
    clearFlash();
    try {
      if (!document) {
        onCreated((await documentsApi.create(value)).document);
        return;
      }
      const saved = (await documentsApi.update(document.id, value, updatedAt)).document;
      setValue(documentInputOf(saved));
      setUpdatedAt(saved.updatedAt);
      showFlash('已保存');
    } catch (error) {
      setFailure({ action: 'save', error });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!document) return;
    const title = pickText(document.title, 'zh') || '这份文件';
    if (!window.confirm(`确定要删除「${title}」吗？公开网站将不再提供这份文件，删除后无法恢复。`)) return;
    setBusy('deleting');
    setFailure(null);
    clearFlash();
    try {
      await documentsApi.remove(document.id);
      onDeleted();
    } catch (error) {
      setFailure({ action: 'delete', error });
      setBusy(null);
    }
  }

  const status = uploading ? UPLOADING_STATUS : failure ? '未能完成，请查看页面顶部的提示' : flash;

  return (
    <form noValidate onSubmit={(event) => void save(event)}>
      <fieldset disabled={busy !== null} className="min-w-0 space-y-6">
        {failure && <ActionFailedNotice action={failure.action} error={failure.error} onReload={onReload} />}
        {flash && <Notice tone="success">{flash}</Notice>}
        <Notice tone="warning" title="只上传删减后的副本">
          公开文件中不得含有个人联系方式、证件信息或银行账号。含个人信息的原件只保存在内部档案中（章程第 11.2 条与第 11.3 条）。
        </Notice>
        <Panel title="文件信息">
          <Select
            label="文件类别"
            value={value.category}
            onChange={(category) => change({ category })}
            options={CATEGORY_OPTIONS}
            issues={issues}
            field="category"
            required
          />
          <LocalizedInput
            label="文件标题"
            value={value.title}
            onChange={(title) => change({ title })}
            issues={issues}
            field="title"
            required
            maxLength={DOCUMENT_LIMITS.title}
          />
          <DocumentField
            label="PDF 文件"
            value={value.mediaKey || null}
            onChange={(mediaKey) => change({ mediaKey: mediaKey ?? '' })}
            onBusyChange={onBusyChange}
            issues={issues}
            field="mediaKey"
            required
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <DateInput
              label="发布日期"
              value={value.publishedOn}
              onChange={(publishedOn) => change({ publishedOn })}
              issues={issues}
              field="publishedOn"
              required
              hint="显示在文件标题旁，例如账目或会议的日期。"
            />
            <NumberInput
              label="排序"
              value={value.sortOrder}
              onChange={(sortOrder) => change({ sortOrder })}
              issues={issues}
              field="sortOrder"
              min={0}
              max={9999}
              hint="同一类别中数字小的排在前面；数字相同时较新的文件在前。"
            />
          </div>
          <Checkbox label="在网站上显示" checked={value.visible} onChange={(visible) => change({ visible })} hint="取消勾选后文件仍保留在后台，但访客看不到。" />
        </Panel>
      </fieldset>
      <FormActions status={status}>
        {document && (
          <Button variant="danger" busy={busy === 'deleting'} disabled={busy !== null} onClick={() => void remove()}>
            删除文件
          </Button>
        )}
        <Button type="submit" busy={busy === 'saving'} disabled={busy !== null || uploading}>
          {document ? '保存修改' : '创建文件'}
        </Button>
      </FormActions>
    </form>
  );
}
