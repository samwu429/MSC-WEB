import { MAX_URL_LENGTH, SETTINGS_LIMITS, type SiteSettings } from '@msc-web/content';
import { ImageField } from '../../../shared/media/MediaFields';
import { TextInput } from '../../../shared/ui/fields';
import { Panel } from '../../../shared/ui/layout';
import type { SectionProps } from './section';

type ContactLinkKey = keyof Pick<SiteSettings['contact'], 'instagramUrl' | 'xiaohongshuUrl' | 'linkedinUrl' | 'githubUrl'>;

const LINK_FIELDS: readonly { key: ContactLinkKey; label: string }[] = [
  { key: 'instagramUrl', label: 'Instagram 链接' },
  { key: 'xiaohongshuUrl', label: '小红书链接' },
  { key: 'linkedinUrl', label: 'LinkedIn 链接' },
  { key: 'githubUrl', label: 'GitHub 链接' },
];

export function ContactSection({ value, onPatch, issues, onBusyChange }: SectionProps<'contact'> & { onBusyChange: (busy: boolean) => void }) {
  return (
    <Panel title="联系方式" description="邮箱、微信与社交媒体账号。不需要的项目留空即可。">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label="联系邮箱"
          type="email"
          value={value.email}
          onChange={(email) => onPatch({ email })}
          issues={issues}
          field="contact.email"
          autoComplete="off"
        />
        <TextInput
          label="微信号"
          value={value.wechatId}
          onChange={(wechatId) => onPatch({ wechatId })}
          issues={issues}
          field="contact.wechatId"
          maxLength={SETTINGS_LIMITS.wechatId}
          autoComplete="off"
        />
      </div>
      <ImageField
        label="微信二维码"
        value={value.wechatQrKey}
        onChange={(wechatQrKey) => onPatch({ wechatQrKey })}
        onBusyChange={onBusyChange}
        issues={issues}
        field="contact.wechatQrKey"
        aspect="aspect-square"
        hint="建议上传 PNG 格式的二维码，PNG 会保持原格式，扫描更清晰。"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {LINK_FIELDS.map((link) => (
          <TextInput
            key={link.key}
            label={link.label}
            type="url"
            value={value[link.key]}
            onChange={(url) => onPatch({ [link.key]: url })}
            issues={issues}
            field={`contact.${link.key}`}
            maxLength={MAX_URL_LENGTH}
            placeholder="https://"
          />
        ))}
      </div>
    </Panel>
  );
}
