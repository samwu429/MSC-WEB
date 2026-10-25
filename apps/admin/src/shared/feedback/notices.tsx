import { ApiError } from '../api/client';
import { errorMessage } from '../forms/issues';
import { Button } from '../ui/Button';
import { Notice } from '../ui/feedback';

/**
 * Notices every editing screen shows the same way: a load that failed, a save that lost to a newer version, and a
 * save or delete the server refused.
 * 每个编辑页面以相同方式显示的提示：加载失败、保存时版本已过期，以及服务器拒绝的保存或删除。
 */

export type FormAction = 'save' | 'delete';

export interface ActionFailure {
  action: FormAction;
  error: unknown;
}

export const FAILED_ACTION_LABELS: Record<FormAction, string> = {
  save: '未能保存',
  delete: '未能删除',
};

export function isStaleError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'stale';
}

export function LoadFailedNotice({ error, onRetry, title = '加载失败' }: { error: unknown; onRetry: () => void; title?: string }) {
  return (
    <Notice tone="error" title={title}>
      <p>{errorMessage(error)}</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
        重试
      </Button>
    </Notice>
  );
}

/**
 * Another officer saved first. Versions are not merged, so the editor is offered the newer copy instead, which
 * discards the unsaved edits on this page.
 * 另一位干部已先保存。不同版本不会被合并，因此为编辑者提供较新的副本，这会放弃本页面上尚未保存的修改。
 */
export function StaleNotice({ onReload }: { onReload: () => void }) {
  return (
    <Notice tone="warning" title="其他干部已先保存了这条内容">
      <p>你的修改尚未保存。重新加载会显示最新的内容，并放弃本页面上未保存的修改。</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={onReload}>
        重新加载
      </Button>
    </Notice>
  );
}

/** A failed save or delete: the stale notice for a lost race, otherwise the server's own message. */
/** 保存或删除失败：版本冲突时显示过期提示，否则显示服务器给出的说明。 */
export function ActionFailedNotice({ action, error, onReload }: { action: FormAction; error: unknown; onReload: () => void }) {
  if (isStaleError(error)) return <StaleNotice onReload={onReload} />;
  return (
    <Notice tone="error" title={FAILED_ACTION_LABELS[action]}>
      {errorMessage(error)}
    </Notice>
  );
}
