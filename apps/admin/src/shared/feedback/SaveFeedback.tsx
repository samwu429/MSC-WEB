import { Notice } from '../ui/feedback';
import { ActionFailedNotice, type ActionFailure } from './notices';

/**
 * The outcome of the last save or delete, shown beside the form's buttons: the same failure notice every editing
 * screen shows, or a short success message.
 * 上一次保存或删除的结果，显示在表单按钮旁：与所有编辑页面相同的失败提示，或简短的成功提示。
 */
export function SaveFeedback({ failure, flash, onReload }: { failure: ActionFailure | null; flash: string | null; onReload: () => void }) {
  if (failure) return <ActionFailedNotice action={failure.action} error={failure.error} onReload={onReload} />;
  if (flash) return <Notice tone="success">{flash}</Notice>;
  return null;
}
