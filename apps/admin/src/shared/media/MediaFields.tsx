import { useId, useRef, useState, type ReactNode } from 'react';
import { MAX_DOCUMENT_BYTES, mediaUrl, type MediaRecord } from '@msc-web/content';
import { uploadMedia } from '../api/endpoints';
import { errorMessage, type IssueMap } from '../forms/issues';
import { Button } from '../ui/Button';
import { Field } from '../ui/fields';
import { prepareImage } from './compress-image';

/**
 * Upload controls. A file is uploaded as soon as it is chosen and the field holds only the returned media key;
 * the record that uses it is saved separately with the rest of the form, which holds its save while an upload runs
 * so the record is never saved with the previous key.
 * 上传控件。选择文件后立即上传，字段只保存返回的媒体键；使用该文件的记录随表单其余部分一起另行保存。
 * 上传进行期间表单会暂缓保存，记录因此不会带着旧的媒体键被保存。
 */

export function ImageField(props: {
  label: string;
  value: string | null;
  onChange: (key: string | null, media?: MediaRecord) => void;
  issues: IssueMap;
  field: string;
  hint?: ReactNode;
  /** Tailwind aspect class for the preview, such as aspect-video or aspect-[4/5]. */
  /** 预览框的 Tailwind 宽高比类名，例如 aspect-video 或 aspect-[4/5]。 */
  aspect?: string;
  required?: boolean;
  onBusyChange?: (busy: boolean) => void;
  /** "contain" shows the whole image, for logos and QR codes that must not be cropped. */
  /** "contain" 显示完整图片，用于不能被裁切的 Logo 与二维码。 */
  fit?: 'cover' | 'contain';
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function choose(file: File | undefined) {
    if (!file) return;
    props.onBusyChange?.(true);
    setBusy(true);
    setUploadError(null);
    try {
      const prepared = await prepareImage(file);
      const { media } = await uploadMedia(prepared.blob, 'image', prepared.name);
      props.onChange(media.key, media);
    } catch (error) {
      setUploadError(errorMessage(error));
    } finally {
      setBusy(false);
      props.onBusyChange?.(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <Field label={props.label} htmlFor={inputId} hint={props.hint ?? '支持 JPG、PNG、WebP，上传前会自动压缩'} error={uploadError ?? props.issues.get(props.field)} required={props.required}>
      <div className="flex flex-wrap items-start gap-4">
        <div className={`w-48 overflow-hidden rounded-lg border border-line bg-canvas ${props.aspect ?? 'aspect-video'}`}>
          {props.value ? (
            <img src={mediaUrl(props.value)} alt="" className={`h-full w-full ${props.fit === 'contain' ? 'bg-white object-contain p-2' : 'object-cover'}`} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-ink-muted">未上传</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={input} id={inputId} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" onChange={(event) => void choose(event.target.files?.[0])} />
          <Button variant="secondary" size="sm" busy={busy} onClick={() => input.current?.click()}>
            {props.value ? '更换图片' : '上传图片'}
          </Button>
          {props.value && !busy && (
            <Button variant="ghost" size="sm" onClick={() => props.onChange(null)}>
              移除
            </Button>
          )}
        </div>
      </div>
    </Field>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentField(props: {
  label: string;
  value: string | null;
  /** Name and size of the current file when known, from the upload or from the record. */
  /** 已知时当前文件的名称与大小，来自上传结果或记录。 */
  fileLabel?: string;
  onChange: (key: string | null, media?: MediaRecord) => void;
  issues: IssueMap;
  field: string;
  hint?: ReactNode;
  required?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<MediaRecord | null>(null);

  async function choose(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      setUploadError('请选择 PDF 文件');
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setUploadError(`文件不能超过 ${formatBytes(MAX_DOCUMENT_BYTES)}`);
      return;
    }
    props.onBusyChange?.(true);
    setBusy(true);
    try {
      const { media } = await uploadMedia(file.type ? file : new Blob([file], { type: 'application/pdf' }), 'document', file.name);
      setUploaded(media);
      props.onChange(media.key, media);
    } catch (error) {
      setUploadError(errorMessage(error));
    } finally {
      setBusy(false);
      props.onBusyChange?.(false);
      if (input.current) input.current.value = '';
    }
  }

  const current = uploaded && uploaded.key === props.value ? `${uploaded.fileName} · ${formatBytes(uploaded.size)}` : props.fileLabel;

  return (
    <Field label={props.label} htmlFor={inputId} hint={props.hint ?? `PDF，最大 ${formatBytes(MAX_DOCUMENT_BYTES)}`} error={uploadError ?? props.issues.get(props.field)} required={props.required}>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={input} id={inputId} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => void choose(event.target.files?.[0])} />
        <Button variant="secondary" size="sm" busy={busy} onClick={() => input.current?.click()}>
          {props.value ? '更换文件' : '上传 PDF'}
        </Button>
        {props.value ? (
          <a href={mediaUrl(props.value)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-700 hover:underline">
            {current || '查看当前文件'}
          </a>
        ) : (
          <span className="text-sm text-ink-muted">未上传</span>
        )}
        {props.value && !busy && (
          <Button variant="ghost" size="sm" onClick={() => props.onChange(null)}>
            移除
          </Button>
        )}
      </div>
    </Field>
  );
}
