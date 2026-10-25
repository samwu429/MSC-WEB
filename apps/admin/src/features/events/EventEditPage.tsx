import { useParams } from 'react-router-dom';
import { eventsApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { Spinner } from '../../shared/ui/feedback';
import { PageHeader } from '../../shared/ui/layout';
import { EventForm } from './form/EventForm';
import { EventPhotosPanel } from './photos/EventPhotosPanel';

/**
 * /events/new and /events/:eventId. The form is keyed by the loaded version, so reloading after a conflict starts
 * it again from the newest saved record; the gallery is keyed by the event alone and keeps its uploads meanwhile.
 * /events/new 与 /events/:eventId。表单以加载到的版本为 key，因此冲突后重新加载会以最新保存的记录重新开始编辑；
 * 相册只以活动为 key，其间的上传不受影响。
 */
export function EventEditPage() {
  const { eventId } = useParams();
  const { state, reload } = useLoad(() => (eventId ? eventsApi.get(eventId).then(({ event }) => event) : Promise.resolve(null)), [eventId]);

  return (
    <>
      <PageHeader
        title={eventId ? '编辑活动' : '新建活动'}
        description={eventId ? undefined : '保存后即可添加活动照片。'}
        back={{ to: '/events', label: '返回活动列表' }}
      />
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <LoadFailedNotice error={state.error} onRetry={reload} />}
      {state.status === 'ready' && (
        <>
          <EventForm key={state.data ? `${state.data.id}:${state.data.updatedAt}` : 'new'} event={state.data} onReload={reload} />
          {state.data && <EventPhotosPanel key={state.data.id} eventId={state.data.id} initialPhotos={state.data.photos} />}
        </>
      )}
    </>
  );
}
