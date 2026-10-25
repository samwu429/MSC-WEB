import { useState, type FormEvent } from 'react';
import { EVENT_LIMITS, mediaUrl, pickText, type EventPhoto } from '@msc-web/content';
import { eventsApi } from '../../../shared/api/endpoints';
import { errorMessage, issuesOf } from '../../../shared/forms/issues';
import { Button } from '../../../shared/ui/Button';
import { Notice } from '../../../shared/ui/feedback';
import { LocalizedInput, NumberInput } from '../../../shared/ui/fields';
import { MAX_PHOTO_SORT_ORDER } from './photo-upload';

type Busy = 'save' | 'delete' | null;

/** One gallery photo. Only its caption and order can change; a different picture is uploaded as a new photo. */
/** 相册中的一张照片。只能修改说明与排序；换一张图片需要作为新照片上传。 */
export function PhotoCard(props: { eventId: string; photo: EventPhoto; onSaved: (photo: EventPhoto) => void; onRemoved: (photoId: string) => void }) {
  const { eventId, photo } = props;
  const [caption, setCaption] = useState(photo.caption);
  const [sortOrder, setSortOrder] = useState(photo.sortOrder);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<unknown>(null);
  const [justSaved, setJustSaved] = useState(false);
  const issues = issuesOf(error);
  const dirty = caption.zh !== photo.caption.zh || caption.en !== photo.caption.en || sortOrder !== photo.sortOrder;
  const url = mediaUrl(photo.mediaKey);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy('save');
    setError(null);
    try {
      const { photo: updated } = await eventsApi.updatePhoto(eventId, photo.id, { caption, sortOrder });
      setCaption(updated.caption);
      setSortOrder(updated.sortOrder);
      setJustSaved(true);
      props.onSaved(updated);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm('确定要从相册中删除这张照片吗？删除后无法恢复。')) return;
    setBusy('delete');
    setError(null);
    try {
      await eventsApi.removePhoto(eventId, photo.id);
      props.onRemoved(photo.id);
    } catch (failure) {
      setError(failure);
      setBusy(null);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void save(event)}
      className="flex h-full flex-col gap-4 rounded-lg border border-line p-4 sm:flex-row xl:flex-col"
    >
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title="查看原图"
        className="block aspect-[4/3] w-full shrink-0 self-start overflow-hidden rounded-md bg-canvas sm:w-48 xl:w-full"
      >
        <img src={url} alt={pickText(caption, 'zh') || '活动照片'} loading="lazy" className="h-full w-full object-cover" />
      </a>
      <fieldset disabled={busy !== null} className="min-w-0 flex-1 space-y-3">
        {error !== null && <Notice tone="error">{errorMessage(error)}</Notice>}
        <LocalizedInput
          label="照片说明"
          value={caption}
          onChange={(next) => {
            setCaption(next);
            setJustSaved(false);
          }}
          issues={issues}
          field="caption"
          maxLength={EVENT_LIMITS.caption}
        />
        <div className="flex flex-wrap items-end gap-2">
          <NumberInput
            label="排序"
            value={sortOrder}
            onChange={(next) => {
              setSortOrder(next);
              setJustSaved(false);
            }}
            issues={issues}
            field="sortOrder"
            min={0}
            max={MAX_PHOTO_SORT_ORDER}
            className="w-24"
          />
          <Button type="submit" size="sm" busy={busy === 'save'} disabled={!dirty}>
            保存
          </Button>
          <Button variant="danger" size="sm" busy={busy === 'delete'} onClick={() => void remove()}>
            删除
          </Button>
          {justSaved && !dirty && <span className="pb-2 text-xs font-semibold text-emerald-700">已保存</span>}
        </div>
      </fieldset>
    </form>
  );
}
