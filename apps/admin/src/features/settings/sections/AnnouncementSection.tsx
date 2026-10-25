import { MAX_URL_LENGTH, SETTINGS_LIMITS } from '@msc-web/content';
import { Checkbox, LocalizedInput, TextInput } from '../../../shared/ui/fields';
import { Panel } from '../../../shared/ui/layout';
import type { SectionProps } from './section';

export function AnnouncementSection({ value, onPatch, issues }: SectionProps<'announcement'>) {
  return (
    <Panel title="公告栏" description="开启后，公开网站会显示一条简短公告，适合报名截止、活动改期等临时通知。">
      <Checkbox
        label="显示公告"
        checked={value.enabled}
        onChange={(enabled) => onPatch({ enabled })}
        hint="关闭后公告内容仍会保留，方便下次再用。"
      />
      <LocalizedInput
        label="公告内容"
        value={value.text}
        onChange={(text) => onPatch({ text })}
        issues={issues}
        field="announcement.text"
        required={value.enabled}
        maxLength={SETTINGS_LIMITS.announcement}
      />
      <TextInput
        label="公告链接"
        value={value.url}
        onChange={(url) => onPatch({ url })}
        issues={issues}
        field="announcement.url"
        maxLength={MAX_URL_LENGTH}
        hint="可选。点击公告时打开的本站路径（例如 /events）或以 https:// 开头的完整网址。"
      />
    </Panel>
  );
}
