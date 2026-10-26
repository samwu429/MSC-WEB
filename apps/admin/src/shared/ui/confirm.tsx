import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for deletions and anything else that cannot be undone. */
  /** 删除等无法撤销的操作使用 "danger"。 */
  tone?: 'danger' | 'primary';
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * Asks the officer to confirm in a dialog that matches the backend, in place of the browser's own confirm box.
 * One question at a time; the answer resolves the promise the caller awaits.
 * 以与后台风格一致的对话框请干部确认，取代浏览器自带的确认框。一次只问一个问题，回答会兑现调用方等待的 Promise。
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((answer: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((options) => {
    resolver.current?.(false);
    setRequest(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function answer(value: boolean) {
    resolver.current?.(value);
    resolver.current = null;
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={request !== null}
        title={request?.title ?? ''}
        onCancel={() => answer(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => answer(false)}>
              {request?.cancelLabel ?? '取消'}
            </Button>
            <Button variant={request?.tone === 'danger' ? 'danger-solid' : 'primary'} onClick={() => answer(true)} autoFocus>
              {request?.confirmLabel ?? '确定'}
            </Button>
          </>
        }
      >
        {request?.message}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider');
  return confirm;
}
