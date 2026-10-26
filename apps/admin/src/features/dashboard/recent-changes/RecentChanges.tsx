import type { ChangeLogEntry } from '@msc-web/content';
import { EmptyState } from '../../../shared/ui/feedback';
import { CHANGE_ACTION_LABELS, CHANGE_ENTITY_LABELS } from './change-labels';
import { formatChangeTime } from './change-time';

const ACTION_COLORS: Record<ChangeLogEntry['action'], string> = {
  create: 'text-emerald-700',
  update: 'text-brand-700',
  delete: 'text-red-700',
};

/**
 * The change history as a compact log, one line per change: when, what was done to what, and who did it. The
 * summary of the item is cut to the line and shown in full on hover.
 * 以紧凑日志显示的修改记录，每条修改一行：时间、对什么做了什么、由谁修改。条目摘要截断在一行内，悬停时显示完整内容。
 */
export function RecentChanges({ changes }: { changes: readonly ChangeLogEntry[] }) {
  const now = new Date();
  if (changes.length === 0) {
    return <EmptyState title="还没有修改记录">保存任何内容后，这里会显示修改人、时间与修改的内容。</EmptyState>;
  }
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white text-sm shadow-sm">
      {changes.map((change) => (
        <li key={change.id} className="flex items-baseline gap-3 px-4 py-2">
          <time dateTime={change.at} className="w-24 shrink-0 whitespace-nowrap text-xs tabular-nums text-ink-muted">
            {formatChangeTime(change.at, now)}
          </time>
          <span className={`shrink-0 text-xs font-semibold ${ACTION_COLORS[change.action]}`}>{CHANGE_ACTION_LABELS[change.action]}</span>
          <span className="shrink-0 font-medium text-ink">{CHANGE_ENTITY_LABELS[change.entity]}</span>
          <span className="min-w-0 flex-1 truncate text-ink-soft" title={change.summary || undefined}>
            {change.summary}
          </span>
          <span className="hidden shrink-0 text-xs text-ink-muted sm:inline">{change.memberName || '未命名成员'}</span>
        </li>
      ))}
    </ol>
  );
}
