import { Link } from 'react-router-dom';
import { pickText, type CourseSummary } from '@msc-web/content';
import { coursesApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { useArrivalNotice } from '../../shared/feedback/useArrivalNotice';
import { useFlash } from '../../shared/feedback/useFlash';
import { LinkButton } from '../../shared/ui/Button';
import { Badge, EmptyState, Notice, Spinner } from '../../shared/ui/feedback';
import { PageHeader } from '../../shared/ui/layout';

function CourseList({ courses }: { courses: readonly CourseSummary[] }) {
  if (courses.length === 0) {
    return <EmptyState title="还没有课程">点击“新增课程”添加第一门课程，然后在课程页面中安排复习场次。</EmptyState>;
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      {courses.map((course) => (
        <li key={course.id}>
          <Link to={`/reviews/courses/${course.id}`} className="flex flex-col gap-2 px-4 py-3 hover:bg-brand-50 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-brand-800">{course.code}</span>
                {!course.visible && <Badge>已隐藏</Badge>}
              </div>
              <p className="mt-0.5 break-words text-sm text-ink">{pickText(course.title, 'zh')}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
              <span>场次 {course.sessionCount}</span>
              <span>已发布 {course.publishedSessionCount}</span>
              <span className="font-semibold text-brand-700">编辑</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Courses with test reviews. Sessions and their materials are edited from each course's page.
 * 开设考前复习的课程。复习场次及其资料在各课程的页面中编辑。
 */
export function CourseListPage() {
  const { state, reload } = useLoad(() => coursesApi.list(), []);
  const { flash } = useFlash(useArrivalNotice());

  return (
    <>
      <PageHeader
        title="考前复习"
        description="每门课程每学期都可以安排期中复习和期末复习。先添加课程，再在课程页面中添加各学期的复习场次与资料。"
        actions={
          <LinkButton to="/reviews/courses/new" variant="primary">
            新增课程
          </LinkButton>
        }
      />
      <div className="space-y-4">
        {flash && <Notice tone="success">{flash}</Notice>}
        {state.status === 'loading' && <Spinner />}
        {state.status === 'error' && <LoadFailedNotice error={state.error} onRetry={reload} />}
        {state.status === 'ready' && <CourseList courses={state.data.courses} />}
      </div>
    </>
  );
}
