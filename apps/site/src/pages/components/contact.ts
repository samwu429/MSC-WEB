import type { SiteSettings } from '@msc-web/content';

/**
 * Whether the editors have entered any way to reach the Group. The About page and the footer both leave their
 * contact block out until one is set.
 * 编辑者是否填写了任何联系方式。在填写之前，关于页面与页脚都不显示联系方式板块。
 */
export function hasContactDetails(contact: SiteSettings['contact']): boolean {
  const { email, wechatId, wechatQrKey, instagramUrl, xiaohongshuUrl, linkedinUrl, githubUrl } = contact;
  return Boolean(email || wechatId || wechatQrKey || instagramUrl || xiaohongshuUrl || linkedinUrl || githubUrl);
}
