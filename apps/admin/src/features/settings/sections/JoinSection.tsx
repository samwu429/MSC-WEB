import { DEFAULT_SITE_SETTINGS, MAX_URL_LENGTH, SETTINGS_LIMITS } from '@msc-web/content';
import { LocalizedInput, TextInput } from '../../../shared/ui/fields';
import { Panel } from '../../../shared/ui/layout';
import { PARAGRAPH_HINT, type SectionProps } from './section';

export function JoinSection({ value, onPatch, issues }: SectionProps<'join'>) {
  return (
    <Panel title="加入我们" description="说明如何成为成员，以及“加入我们”按钮的去向。">
      <LocalizedInput
        label="加入说明"
        value={value.text}
        onChange={(text) => onPatch({ text })}
        issues={issues}
        field="join.text"
        required
        multiline
        maxLength={SETTINGS_LIMITS.joinText}
        hint={PARAGRAPH_HINT}
      />
      <TextInput
        label="加入链接"
        value={value.url}
        onChange={(url) => onPatch({ url })}
        issues={issues}
        field="join.url"
        maxLength={MAX_URL_LENGTH}
        placeholder={DEFAULT_SITE_SETTINGS.join.url}
        hint={`可以填写本站路径（例如 ${DEFAULT_SITE_SETTINGS.join.url}），也可以填写以 https:// 开头的完整网址。留空时使用 ${DEFAULT_SITE_SETTINGS.join.url}。`}
      />
    </Panel>
  );
}
