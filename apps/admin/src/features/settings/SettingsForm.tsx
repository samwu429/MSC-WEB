import { useState, type FormEvent } from 'react';
import type { SettingsResponse, SiteSettings } from '@msc-web/content';
import { settingsApi } from '../../shared/api/endpoints';
import { ActionFailedNotice } from '../../shared/feedback/notices';
import { issuesOf } from '../../shared/forms/issues';
import { UPLOADING_STATUS, useUploadsInProgress } from '../../shared/media/useUploadsInProgress';
import { Button } from '../../shared/ui/Button';
import { Notice } from '../../shared/ui/feedback';
import { FormActions } from '../../shared/ui/layout';
import { AboutSection } from './sections/AboutSection';
import { AnnouncementSection } from './sections/AnnouncementSection';
import { ContactSection } from './sections/ContactSection';
import { HeroSection } from './sections/HeroSection';
import { JoinSection } from './sections/JoinSection';
import type { PartnerListChange } from './sections/partner-list';
import { PartnersSection } from './sections/PartnersSection';
import { patchSettings } from './sections/section';

/**
 * The whole settings document is edited and saved at once, carrying the updatedAt it was loaded with; the server
 * refuses the save as stale when another officer saved in between.
 * 整份设置文档一起编辑、一起保存，并附带加载时的 updatedAt；若其间有其他干部已保存，服务器会以版本过期拒绝本次保存。
 */
export function SettingsForm({ initial, onReload }: { initial: SettingsResponse; onReload: () => void }) {
  const [settings, setSettings] = useState<SiteSettings>(initial.settings);
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const { uploading, onBusyChange } = useUploadsInProgress();
  const issues = issuesOf(error);

  function patch<K extends keyof SiteSettings>(key: K, part: Partial<SiteSettings[K]>) {
    setSettings((current) => patchSettings(current, key, part));
    setSaved(false);
  }

  /** The partner list changes against the latest list, so a late logo upload keeps edits made meanwhile. */
  /** 合作名单的修改基于最新的名单，因此较晚完成的 Logo 上传会保留期间所做的修改。 */
  function changePartners(change: PartnerListChange) {
    setSettings((current) => patchSettings(current, 'partners', { items: change(current.partners.items) }));
    setSaved(false);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await settingsApi.save(settings, updatedAt);
      setSettings(response.settings);
      setUpdatedAt(response.updatedAt);
      setSaved(true);
    } catch (failure) {
      setError(failure);
    } finally {
      setSaving(false);
    }
  }

  const status = uploading ? UPLOADING_STATUS : error !== null ? '未能保存，请查看页面顶部的提示' : saved ? '已保存' : null;

  return (
    <form noValidate onSubmit={(event) => void save(event)}>
      <fieldset disabled={saving} className="min-w-0 space-y-6">
        {error !== null && <ActionFailedNotice action="save" error={error} onReload={onReload} />}
        {saved && <Notice tone="success">网站设置已保存。</Notice>}
        <HeroSection value={settings.hero} onPatch={(part) => patch('hero', part)} onBusyChange={onBusyChange} issues={issues} />
        <AboutSection value={settings.about} onPatch={(part) => patch('about', part)} issues={issues} />
        <JoinSection value={settings.join} onPatch={(part) => patch('join', part)} issues={issues} />
        <ContactSection value={settings.contact} onPatch={(part) => patch('contact', part)} onBusyChange={onBusyChange} issues={issues} />
        <PartnersSection items={settings.partners.items} onChange={changePartners} issues={issues} onBusyChange={onBusyChange} />
        <AnnouncementSection value={settings.announcement} onPatch={(part) => patch('announcement', part)} issues={issues} />
      </fieldset>
      <FormActions status={status}>
        <Button type="submit" busy={saving} disabled={uploading}>
          保存设置
        </Button>
      </FormActions>
    </form>
  );
}
