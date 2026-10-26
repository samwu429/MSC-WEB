import { MAX_URL_LENGTH, PARTNER_KINDS, PARTNER_KIND_LABELS, SETTINGS_LIMITS, type Partner } from '@msc-web/content';
import type { IssueMap } from '../../../shared/forms/issues';
import { ImageField } from '../../../shared/media/MediaFields';
import { Button } from '../../../shared/ui/Button';
import { LocalizedInput, Select, TextInput } from '../../../shared/ui/fields';
import { Panel } from '../../../shared/ui/layout';
import { addPartner, movePartner, removePartner, updatePartner, type PartnerListChange } from './partner-list';

const KIND_OPTIONS = PARTNER_KINDS.map((kind) => ({ value: kind, label: PARTNER_KIND_LABELS[kind].zh }));

/**
 * The sponsors, partners and partner clubs on the home page. Entries are edited in place; field paths use the
 * entry's position, which is how validateSiteSettings reports them.
 * 首页上的赞助商、合作商与联动社团。条目在原处编辑；字段路径使用条目所在的位置，与 validateSiteSettings 报告问题的方式一致。
 */
export function PartnersSection({
  items,
  onChange,
  issues,
  onBusyChange,
}: {
  items: Partner[];
  onChange: (change: PartnerListChange) => void;
  issues: IssueMap;
  onBusyChange: (busy: boolean) => void;
}) {
  const full = items.length >= SETTINGS_LIMITS.partners;
  const listError = issues.get('partners.items');
  return (
    <Panel
      title="赞助商、合作商与联动社团"
      description="显示在首页的荣誉顾问上方，按类别分组，每组内按这里的顺序排列。没有 Logo 时首页显示名称。"
      actions={
        <Button variant="secondary" size="sm" disabled={full} onClick={() => onChange(addPartner(crypto.randomUUID()))}>
          添加一项
        </Button>
      }
    >
      {listError && (
        <p className="text-sm font-medium text-red-700" role="alert">
          {listError}
        </p>
      )}
      {items.length === 0 && <p className="text-sm text-ink-muted">还没有添加任何赞助商、合作商或联动社团。添加后首页才会显示这一部分的名单。</p>}
      {items.map((item, index) => {
        const field = `partners.items.${index}`;
        const title = item.name.zh || item.name.en || '未命名';
        return (
          <div key={item.id} className="space-y-4 rounded-lg border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-brand-900">
                {index + 1}. {title}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => onChange(movePartner(item.id, -1))}>
                  上移
                </Button>
                <Button variant="ghost" size="sm" disabled={index === items.length - 1} onClick={() => onChange(movePartner(item.id, 1))}>
                  下移
                </Button>
                <Button variant="danger" size="sm" onClick={() => onChange(removePartner(item.id))}>
                  删除
                </Button>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="类别"
                value={item.kind}
                options={KIND_OPTIONS}
                onChange={(kind) => onChange(updatePartner(item.id, { kind }))}
                issues={issues}
                field={`${field}.kind`}
                required
              />
              <TextInput
                label="网站链接"
                type="url"
                value={item.url}
                onChange={(url) => onChange(updatePartner(item.id, { url }))}
                issues={issues}
                field={`${field}.url`}
                maxLength={MAX_URL_LENGTH}
                placeholder="https://"
                hint="填写后，首页上的 Logo 可以点击打开该网站。"
              />
            </div>
            <LocalizedInput
              label="名称"
              value={item.name}
              onChange={(name) => onChange(updatePartner(item.id, { name }))}
              issues={issues}
              field={`${field}.name`}
              required
              maxLength={SETTINGS_LIMITS.partnerName}
            />
            <ImageField
              label="Logo"
              value={item.logoKey}
              onChange={(logoKey) => onChange(updatePartner(item.id, { logoKey }))}
              onBusyChange={onBusyChange}
              issues={issues}
              field={`${field}.logoKey`}
              aspect="aspect-[3/2]"
              fit="contain"
              hint="建议上传透明背景的 PNG，PNG 会保持原格式。"
            />
            {issues.get(`${field}.id`) && (
              <p className="text-xs font-medium text-red-700" role="alert">
                {issues.get(`${field}.id`)}
              </p>
            )}
          </div>
        );
      })}
    </Panel>
  );
}
