import { DEFAULT_SITE_SETTINGS, SETTINGS_LIMITS } from '@msc-web/content';
import { Button } from '../../../shared/ui/Button';
import { useConfirm } from '../../../shared/ui/confirm';
import { LocalizedInput } from '../../../shared/ui/fields';
import { Panel } from '../../../shared/ui/layout';
import { PARAGRAPH_HINT, type SectionProps } from './section';

const DEFAULT_MISSION = DEFAULT_SITE_SETTINGS.about.mission;

export function AboutSection({ value, onPatch, issues }: SectionProps<'about'>) {
  const isDefault = value.mission.zh === DEFAULT_MISSION.zh && value.mission.en === DEFAULT_MISSION.en;

  const confirm = useConfirm();

  async function restoreDefault() {
    const confirmed = await confirm({
      title: '恢复默认宗旨？',
      message: '会用默认宗旨（取自章程第 2 条与第 3 条）替换当前的中英文文案。点击“保存设置”后才会生效。',
      confirmLabel: '恢复默认',
    });
    if (confirmed) onPatch({ mission: DEFAULT_MISSION });
  }

  return (
    <Panel
      title="关于我们"
      description="关于页面上的联盟宗旨。"
      actions={
        <Button variant="ghost" size="sm" disabled={isDefault} onClick={() => void restoreDefault()}>
          恢复默认文案
        </Button>
      }
    >
      <LocalizedInput
        label="宗旨"
        value={value.mission}
        onChange={(mission) => onPatch({ mission })}
        issues={issues}
        field="about.mission"
        required
        multiline
        rows={10}
        maxLength={SETTINGS_LIMITS.mission}
        hint={PARAGRAPH_HINT}
      />
    </Panel>
  );
}
