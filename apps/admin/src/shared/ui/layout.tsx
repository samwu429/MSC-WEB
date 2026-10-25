import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Page structure inside the shell: a header with title and actions, and white panels that group form sections.
 * 外壳内的页面结构：带标题与操作按钮的页头，以及对表单分组的白色面板。
 */

export function PageHeader(props: { title: string; description?: ReactNode; actions?: ReactNode; back?: { to: string; label: string } }) {
  return (
    <header className="mb-6">
      {props.back && (
        <Link to={props.back.to} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-brand-800">
          <span aria-hidden="true">←</span>
          {props.back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold text-brand-900">{props.title}</h1>
          {props.description && <div className="mt-1.5 max-w-3xl text-sm text-ink-muted">{props.description}</div>}
        </div>
        {props.actions && <div className="flex flex-wrap items-center gap-2">{props.actions}</div>}
      </div>
    </header>
  );
}

export function Panel(props: { title?: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6 ${props.className ?? ''}`}>
      {(props.title || props.actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {props.title && <h2 className="text-base font-bold text-brand-900">{props.title}</h2>}
            {props.description && <div className="mt-1 text-sm text-ink-muted">{props.description}</div>}
          </div>
          {props.actions && <div className="flex flex-wrap gap-2">{props.actions}</div>}
        </div>
      )}
      <div className="space-y-5">{props.children}</div>
    </section>
  );
}

/** A sticky bar at the bottom of long forms, so Save is always in reach. */
/** 长表单底部的吸底栏，保存按钮始终触手可及。 */
export function FormActions({ children, status }: { children: ReactNode; status?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
      <div className="min-w-0 text-sm text-ink-muted">{status}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
