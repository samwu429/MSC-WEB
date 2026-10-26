import { useCallback, useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useBlocker } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';

/** Two form values are the same when their JSON is; form values are plain data, so this is exact enough. */
/** 两个表单值的 JSON 相同即视为相同；表单值都是普通数据，这样比较已足够准确。 */
export function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Ctrl+S or Cmd+S inside a form submits it, as officers expect from any editor, instead of the browser offering
 * to save the page.
 * 在表单内按 Ctrl+S 或 Cmd+S 会提交表单，符合干部对编辑器的习惯，而不是让浏览器保存网页。
 */
export function submitOnSaveShortcut(event: KeyboardEvent<HTMLFormElement>): void {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    event.currentTarget.requestSubmit();
  }
}

/**
 * Keeps unsaved edits from being lost. Closing or reloading the tab asks the browser's own question; following a
 * link inside the backend opens a dialog to stay or leave. A form calls `allowNavigation` just before it navigates
 * on purpose, after creating or deleting a record.
 * 防止未保存的修改丢失。关闭或刷新标签页时由浏览器询问；在后台内点击链接时弹出对话框，可选择留下或离开。
 * 表单在创建或删除记录后主动跳转之前调用 `allowNavigation`。
 */
export function useUnsavedChanges(dirty: boolean): { allowNavigation: () => void; dialog: ReactNode } {
  const allowed = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (allowed.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !allowed.current && currentLocation.pathname !== nextLocation.pathname);

  const allowNavigation = useCallback(() => {
    allowed.current = true;
  }, []);

  const dialog = (
    <Dialog
      open={blocker.state === 'blocked'}
      title="有修改尚未保存"
      onCancel={() => blocker.reset?.()}
      actions={
        <>
          <Button variant="ghost" onClick={() => blocker.proceed?.()}>
            放弃修改并离开
          </Button>
          <Button onClick={() => blocker.reset?.()} autoFocus>
            继续编辑
          </Button>
        </>
      }
    >
      离开这个页面会丢失尚未保存的修改。可以先点「继续编辑」，保存后再离开。
    </Dialog>
  );

  return { allowNavigation, dialog };
}
