import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * A modal dialog on the native <dialog> element, which keeps focus inside, closes on Escape and dims the page.
 * Escape and a click on the dimmed backdrop both count as cancelling.
 * 基于原生 <dialog> 元素的模态对话框：焦点留在对话框内，按 Esc 关闭，并使页面变暗。按 Esc 或点击变暗的背景都视为取消。
 */
export function Dialog(props: { open: boolean; title: string; children?: ReactNode; actions: ReactNode; onCancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { open, onCancel } = props;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="w-[min(92vw,28rem)] rounded-xl border border-line bg-white p-0 text-ink shadow-xl backdrop:bg-brand-900/40"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="p-6">
        <h2 id={titleId} className="text-base font-bold text-brand-900">
          {props.title}
        </h2>
        {props.children && <div className="mt-2 text-sm leading-relaxed text-ink-soft">{props.children}</div>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">{props.actions}</div>
      </div>
    </dialog>
  );
}
