import type { ComponentProps } from 'react';
import type { ChangeLogEntry } from '@msc-web/content';
import { Badge, EmptyState } from '../../../shared/ui/feedback';
import { Panel } from '../../../shared/ui/layout';
import { CHANGE_ACTION_LABELS, CHANGE_ENTITY_LABELS } from './change-labels';
import { formatChangeTime } from './change-time';

const ACTION_TONES: Record<ChangeLogEntry['action'], NonNullable<ComponentProps<typeof Badge>['tone']>> = {
  create: 'green',
  update: 'purple',
  delete: 'red',
};

export function RecentChanges({ changes }: { changes: readonly ChangeLogEntry[] }) {
  const now = new Date();
  return (
    <Panel title="最近修改" description="谁在什么时候修改了网站内容，时间为多伦多时间。">
      {changes.length === 0 ? (
        <EmptyState title="还没有修改记录">保存任何内容后，这里会显示修改人、时间与修改的内容。</EmptyState>
      ) : (
        <ul className="-my-3 divide-y divide-line">
          {changes.map((change) => (
            <li key={change.id} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <Badge tone={ACTION_TONES[change.action]}>{CHANGE_ACTION_LABELS[change.action]}</Badge>
                <span className="font-semibold text-ink">{CHANGE_ENTITY_LABELS[change.entity]}</span>
                {change.summary && <span className="min-w-0 break-words text-ink-soft">{change.summary}</span>}
              </p>
              <p className="shrink-0 text-xs text-ink-muted">
                {change.memberName || '未命名成员'}
                <span aria-hidden="true"> · </span>
                <time dateTime={change.at} className="whitespace-nowrap">
                  {formatChangeTime(change.at, now)}
                </time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
