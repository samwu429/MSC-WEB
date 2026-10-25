import type { ChangeLogEntry } from '@msc-web/content';

export const CHANGE_ACTION_LABELS: Record<ChangeLogEntry['action'], string> = {
  create: '新建',
  update: '修改',
  delete: '删除',
};

export const CHANGE_ENTITY_LABELS: Record<ChangeLogEntry['entity'], string> = {
  settings: '网站设置',
  person: '团队成员',
  event: '活动',
  event_photo: '活动照片',
  course: '复习课程',
  review_session: '复习场次',
  review_material: '复习资料',
  document: '公开文件',
};
