import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pickText, type CourseSummary } from '@msc-web/content';
import { coursesApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { matchesSearch } from '../../shared/data/search';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { useArrivalNotice } from '../../shared/feedback/useArrivalNotice';
import { useFlash } from '../../shared/feedback/useFlash';
import { LinkButton } from '../../shared/ui/Button';
import { Badge, EmptyState, Notice, Spinner } from '../../shared/ui/feedback';
import { SearchInput } from '../../shared/ui/fields';
import { PageHeader } from '../../shared/ui/layout';

function CourseList({ courses, searching, emptyLabel }: { courses: readonly CourseSummary[]; searching: boolean; emptyLabel?: string }) {
  if (courses.length === 0) {
    if (searching) return <EmptyState title="没有找到这门课程">换一个课程代码或名称试试。</EmptyState>;
    if (emptyLabel) return <p className="text-sm text-ink-muted">{emptyLabel}</p>;
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
                {course.archived && <Badge tone="red">已归档</Badge>}
                {course.visible && course.publishedSessionCount === 0 && <Badge tone="gold">网站上还看不到</Badge>}
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
  const [query, setQuery] = useState('');

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
        {state.status === 'ready' && (
          <>
            {state.data.courses.length > 0 && <SearchInput label="搜索课程" value={query} onChange={setQuery} placeholder="搜索课程代码或名称，例如 CSC108" className="sm:w-80" />}
            <CourseList
              courses={state.data.courses.filter((course) => !course.archived && matchesSearch(query, [course.code, course.title.zh, course.title.en]))}
              searching={query.trim() !== ''}
              emptyLabel={state.data.courses.length > 0 ? '没有未结束的课程。' : undefined}
            />
            {state.data.courses.some((course) => course.archived) && (
              <section className="space-y-2 pt-4" aria-labelledby="archived-courses">
                <h2 id="archived-courses" className="text-sm font-bold text-ink-muted">
                  已结束的课程
                  <span className="ml-2 font-normal">网站上显示在复习页面底部的紧凑列表中</span>
                </h2>
                <div className="opacity-80">
                  <CourseList
                    courses={state.data.courses.filter((course) => course.archived && matchesSearch(query, [course.code, course.title.zh, course.title.en]))}
                    searching={query.trim() !== ''}
                  />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
