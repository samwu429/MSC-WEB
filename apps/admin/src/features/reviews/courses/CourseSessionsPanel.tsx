import { Link } from 'react-router-dom';
import { pickText, termLabel, type Course, type ReviewSessionDetail } from '@msc-web/content';
import { LinkButton } from '../../../shared/ui/Button';
import { Notice } from '../../../shared/ui/feedback';
import { Panel } from '../../../shared/ui/layout';
import { formatSchedule } from '../sessions/format-schedule';
import { ExamBadge, StatusBadge } from '../sessions/SessionBadges';
import { groupByTerm } from './session-groups';

function SessionRow({ session }: { session: ReviewSessionDetail }) {
  const subtitle = pickText(session.title, 'zh');
  return (
    <li>
      <Link to={`/reviews/sessions/${session.id}`} className="flex flex-col gap-1.5 px-4 py-3 hover:bg-brand-50 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ExamBadge exam={session.exam} />
            <StatusBadge status={session.status} />
            {subtitle && <span className="min-w-0 break-words text-sm font-semibold text-ink">{subtitle}</span>}
          </div>
          <p className="mt-1 text-sm text-ink-soft">{formatSchedule(session.startsAt, session.endsAt)}</p>
        </div>
        <span className="shrink-0 text-xs text-ink-muted">{session.materials.length} 份资料</span>
      </Link>
    </li>
  );
}

/**
 * The review sessions of a saved course, grouped by term, each linking to its own editor.
 * 已保存课程的复习场次，按学期分组，每一场都链接到自己的编辑页面。
 */
export function CourseSessionsPanel({ course, sessions, className }: { course: Course; sessions: readonly ReviewSessionDetail[]; className?: string }) {
  const groups = groupByTerm(sessions);
  return (
    <Panel
      title="复习场次"
      description="每学期可以安排期中复习和期末复习，同一种复习也可以有多场。"
      actions={
        <LinkButton to={`/reviews/courses/${course.id}/sessions/new`} variant="primary" size="sm">
          新增复习场次
        </LinkButton>
      }
      className={className}
    >
      {course.visible && !sessions.some((session) => session.status === 'published') && (
        <Notice tone="warning" title="网站上还看不到这门课程">
          考前复习页面按学期列出已发布的复习场次。新增一场复习并把状态设为「已发布」后，这门课程才会出现在网站上。
        </Notice>
      )}
      {groups.length === 0 ? (
        <p className="text-sm text-ink-muted">还没有复习场次。</p>
      ) : (
        groups.map((group) => (
          <section key={group.term}>
            <h3 className="mb-2 text-sm font-bold text-ink">{termLabel(group.term).zh}</h3>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {group.sessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </ul>
          </section>
        ))
      )}
    </Panel>
  );
}
