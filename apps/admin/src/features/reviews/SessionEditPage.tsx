import { useParams } from 'react-router-dom';
import type { Course, ReviewSessionDetail } from '@msc-web/content';
import { coursesApi, reviewSessionsApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { Spinner } from '../../shared/ui/feedback';
import { PageHeader } from '../../shared/ui/layout';
import { SessionEditor } from './sessions/SessionEditor';

interface SessionPage {
  course: Course;
  session: ReviewSessionDetail | null;
}

/** An existing session names its course, which is then loaded for the page header. */
/** 已有场次记录了所属课程，随后加载该课程用于页头。 */
async function loadSessionPage(courseId: string | undefined, sessionId: string | undefined): Promise<SessionPage> {
  if (sessionId) {
    const { session } = await reviewSessionsApi.get(sessionId);
    const { course } = await coursesApi.get(session.courseId);
    return { course, session };
  }
  if (!courseId) throw new Error('缺少课程，请从课程页面新增复习场次');
  const { course } = await coursesApi.get(courseId);
  return { course, session: null };
}

/**
 * /reviews/courses/:courseId/sessions/new and /reviews/sessions/:sessionId. The editor is keyed by the loaded
 * version, so reloading after a conflict starts it again from the newest saved session.
 * /reviews/courses/:courseId/sessions/new 与 /reviews/sessions/:sessionId。编辑器以加载到的版本作为 key，
 * 冲突后重新加载时会从最新保存的场次重新开始。
 */
export function SessionEditPage() {
  const { courseId, sessionId } = useParams();
  const { state, reload } = useLoad(() => loadSessionPage(courseId, sessionId), [courseId, sessionId]);

  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error') {
    return (
      <>
        <PageHeader title="复习场次" back={{ to: courseId ? `/reviews/courses/${courseId}` : '/reviews', label: courseId ? '返回课程' : '全部课程' }} />
        <LoadFailedNotice error={state.error} onRetry={reload} />
      </>
    );
  }
  const { course, session } = state.data;
  return <SessionEditor key={session ? `${session.id}:${session.updatedAt}` : 'new'} course={course} session={session} onReload={reload} />;
}
