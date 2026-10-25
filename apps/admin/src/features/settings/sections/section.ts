import type { SiteSettings } from '@msc-web/content';
import type { IssueMap } from '../../../shared/forms/issues';

/**
 * Each panel edits one top-level group of the settings document. Field paths inside a panel are the paths
 * validateSiteSettings reports, such as "hero.tagline", so server issues land under the right control. A panel
 * sends only the fields it changes, and the form merges them into its latest state, so an image upload that
 * finishes late never brings back the values from the moment the file was picked.
 * 每个面板编辑设置文档中的一个顶层分组。面板内的字段路径与 validateSiteSettings 报告的路径一致（如 "hero.tagline"），
 * 服务器返回的问题因此显示在对应的控件下方。面板只发送它修改的字段，表单将其合并到最新的状态中，
 * 因此较晚完成的图片上传永远不会带回选择文件那一刻的旧值。
 */
export interface SectionProps<K extends keyof SiteSettings> {
  value: SiteSettings[K];
  onPatch: (part: Partial<SiteSettings[K]>) => void;
  issues: IssueMap;
}

export function patchSettings<K extends keyof SiteSettings>(settings: SiteSettings, key: K, part: Partial<SiteSettings[K]>): SiteSettings {
  return { ...settings, [key]: { ...settings[key], ...part } };
}

/** How the public site lays out multi-line text written in these fields. */
/** 公开网站对这些字段中多行文字的排版方式。 */
export const PARAGRAPH_HINT = '空一行开始新段落；网址会自动变成链接。';
