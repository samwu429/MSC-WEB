import { useRef, useState } from 'react';
import { emptyText, type EventPhoto } from '@msc-web/content';
import { eventsApi, uploadMedia } from '../../../shared/api/endpoints';
import { prepareImage } from '../../../shared/media/compress-image';
import { Button } from '../../../shared/ui/Button';
import { EmptyState, Notice } from '../../../shared/ui/feedback';
import { Panel } from '../../../shared/ui/layout';
import { PhotoCard } from './PhotoCard';
import { addPhotosInOrder, fitInGallery, nextPhotoSortOrder, sortPhotos, type PhotoUploadReport } from './photo-upload';

/**
 * The gallery of a saved event. Each photo is stored as soon as it is uploaded, independently of the event form,
 * so a batch from the event night survives even if the form itself is never saved again.
 * 已保存活动的相册。每张照片上传后立即保存，与活动表单相互独立；即使活动表单之后不再保存，活动当晚上传的一批照片也会保留。
 */
export function EventPhotosPanel(props: { eventId: string; initialPhotos: readonly EventPhoto[] }) {
  const { eventId } = props;
  const input = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(() => sortPhotos(props.initialPhotos));
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [report, setReport] = useState<PhotoUploadReport | null>(null);

  async function addPhoto(file: File, sortOrder: number): Promise<EventPhoto> {
    const prepared = await prepareImage(file);
    const { media } = await uploadMedia(prepared.blob, 'image', prepared.name);
    const { photo } = await eventsApi.addPhoto(eventId, { mediaKey: media.key, caption: emptyText(), sortOrder });
    return photo;
  }

  async function addFiles(files: File[]) {
    if (input.current) input.current.value = '';
    if (files.length === 0) return;
    setReport(null);
    const { fitting, refused } = fitInGallery(files, photos.length);
    const result = await addPhotosInOrder(fitting, nextPhotoSortOrder(photos), {
      add: addPhoto,
      onProgress: (current, total) => setProgress({ current, total }),
      onAdded: (photo) => setPhotos((current) => sortPhotos([...current, photo])),
    });
    setProgress(null);
    setReport({ added: result.added, failed: [...result.failed, ...refused] });
  }

  function replacePhoto(updated: EventPhoto) {
    setPhotos((current) => sortPhotos(current.map((photo) => (photo.id === updated.id ? updated : photo))));
  }

  function removePhoto(photoId: string) {
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));
  }

  const uploading = progress !== null;

  return (
    <Panel
      title="活动照片"
      description="照片显示在活动页面的相册中，按排序数字从小到大排列。可以一次选择多张。"
      className="mt-6"
      actions={
        <>
          <input
            ref={input}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => void addFiles(Array.from(event.target.files ?? []))}
          />
          <Button variant="secondary" size="sm" busy={uploading} onClick={() => input.current?.click()}>
            添加照片
          </Button>
        </>
      }
    >
      {progress && (
        <Notice tone="info">
          正在上传 {progress.current}/{progress.total}
        </Notice>
      )}
      {report && report.added.length > 0 && <Notice tone="success">已添加 {report.added.length} 张照片</Notice>}
      {report && report.failed.length > 0 && (
        <Notice tone="error" title={`${report.failed.length} 张照片未能添加`}>
          <ul className="list-disc space-y-0.5 pl-5">
            {report.failed.map((failure, index) => (
              <li key={`${index}:${failure.fileName}`} className="break-all">
                {failure.fileName}：{failure.message}
              </li>
            ))}
          </ul>
        </Notice>
      )}
      {photos.length === 0 ? (
        <EmptyState title="还没有照片">活动结束后可以在这里添加现场照片。</EmptyState>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {photos.map((photo) => (
            <li key={photo.id}>
              <PhotoCard eventId={eventId} photo={photo} onSaved={replacePhoto} onRemoved={removePhoto} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
