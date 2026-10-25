import { settingsApi } from '../../shared/api/endpoints';
import { useLoad } from '../../shared/data/useLoad';
import { LoadFailedNotice } from '../../shared/feedback/notices';
import { Spinner } from '../../shared/ui/feedback';
import { PageHeader } from '../../shared/ui/layout';
import { SettingsForm } from './SettingsForm';

/**
 * The form is keyed by the loaded version, so reloading after a conflict replaces every field with the newer copy.
 * 表单以加载到的版本作为 key，因此冲突后重新加载会用较新的副本替换所有字段。
 */
export function SettingsPage() {
  const { state, reload } = useLoad(() => settingsApi.get(), []);
  return (
    <>
      <PageHeader title="网站设置" description="首页文案、关于我们、加入方式、联系方式与公告栏。保存后公开网站会使用新的内容。" />
      {state.status === 'loading' && <Spinner label="正在加载网站设置" />}
      {state.status === 'error' && <LoadFailedNotice title="无法加载网站设置" error={state.error} onRetry={reload} />}
      {state.status === 'ready' && <SettingsForm key={state.data.updatedAt ?? 'never-saved'} initial={state.data} onReload={reload} />}
    </>
  );
}
