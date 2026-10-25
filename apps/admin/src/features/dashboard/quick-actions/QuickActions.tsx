import type { SitePermission } from '@msc-web/content';
import { useSession } from '../../../shared/session/SessionProvider';
import { LinkButton } from '../../../shared/ui/Button';
import { Panel } from '../../../shared/ui/layout';

interface QuickAction {
  to: string;
  label: string;
  permission: SitePermission;
}

const QUICK_ACTIONS: readonly QuickAction[] = [
  { to: '/events/new', label: '新建活动', permission: 'events.edit' },
  { to: '/reviews/courses/new', label: '新建复习课程', permission: 'reviews.edit' },
  { to: '/people/new', label: '添加成员', permission: 'people.edit' },
  { to: '/documents/new', label: '上传公开文件', permission: 'documents.edit' },
  { to: '/settings', label: '编辑网站设置', permission: 'settings.edit' },
];

export function QuickActions() {
  const { can } = useSession();
  const actions = QUICK_ACTIONS.filter((action) => can(action.permission));
  if (actions.length === 0) return null;
  return (
    <Panel title="快捷操作">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <LinkButton key={action.to} to={action.to}>
            {action.label}
          </LinkButton>
        ))}
      </div>
    </Panel>
  );
}
