import { useParams } from 'react-router-dom';
import { coursesApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { Spinner } from '../../shared/ui/feedback';
import { PageHeader } from '../../shared/ui/layout';
import { CourseEditor } from './courses/CourseEditor';

/**
 * /reviews/courses/new and /reviews/courses/:courseId. The editor is keyed by the loaded version, so reloading after
 * a conflict starts it again from the newest saved course.
 * /reviews/courses/new 与 /reviews/courses/:courseId。编辑器以加载到的版本作为 key，冲突后重新加载时会从最新保存的课程重新开始。
 */
export function CourseEditPage() {
  const { courseId } = useParams();
  const { state, reload } = useLoad(() => (courseId ? coursesApi.get(courseId) : Promise.resolve(null)), [courseId]);

  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error') {
    return (
      <>
        <PageHeader title="课程" back={{ to: '/reviews', label: '全部课程' }} />
        <LoadFailedNotice error={state.error} onRetry={reload} />
      </>
    );
  }
  const loaded = state.data;
  return <CourseEditor key={loaded ? `${loaded.course.id}:${loaded.course.updatedAt}` : 'new'} loaded={loaded} onReload={reload} />;
}
