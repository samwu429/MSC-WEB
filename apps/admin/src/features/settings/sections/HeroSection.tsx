import { SETTINGS_LIMITS } from '@msc-web/content';
import { ImageField } from '../../../shared/media/MediaFields';
import { LocalizedInput } from '../../../shared/ui/fields';
import { Panel } from '../../../shared/ui/layout';
import { PARAGRAPH_HINT, type SectionProps } from './section';

export function HeroSection({ value, onPatch, issues, onBusyChange }: SectionProps<'hero'> & { onBusyChange: (busy: boolean) => void }) {
  return (
    <Panel title="首页主视觉" description="访客打开首页时最先看到的标语、介绍与照片。">
      <LocalizedInput
        label="标语"
        value={value.tagline}
        onChange={(tagline) => onPatch({ tagline })}
        issues={issues}
        field="hero.tagline"
        required
        maxLength={SETTINGS_LIMITS.tagline}
      />
      <LocalizedInput
        label="首页介绍"
        value={value.intro}
        onChange={(intro) => onPatch({ intro })}
        issues={issues}
        field="hero.intro"
        required
        multiline
        rows={5}
        maxLength={SETTINGS_LIMITS.intro}
        hint={PARAGRAPH_HINT}
      />
      <ImageField
        label="首页图片"
        value={value.imageKey}
        onChange={(imageKey) => onPatch({ imageKey })}
        onBusyChange={onBusyChange}
        issues={issues}
        field="hero.imageKey"
        aspect="aspect-[4/3]"
        hint="留空时使用网站自带的照片。支持 JPG、PNG、WebP，上传前会自动压缩。"
      />
    </Panel>
  );
}
