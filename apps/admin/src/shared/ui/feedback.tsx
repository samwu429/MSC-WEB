import type { ReactNode } from 'react';

/**
 * Status displays: notices, a loading spinner, empty states and status badges.
 * 状态显示：提示条、加载指示、空状态与状态标记。
 */

const NOTICE_TONES = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-brand-200 bg-brand-50 text-brand-900',
  warning: 'border-gold-600/40 bg-gold-100 text-ink',
} as const;

export function Notice({ tone = 'info', title, children }: { tone?: keyof typeof NOTICE_TONES; title?: string; children?: ReactNode }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${NOTICE_TONES[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  );
}

export function Spinner({ label = '加载中' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-ink-muted" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-r-transparent" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-white/60 px-6 py-12 text-center">
      <p className="font-semibold text-ink-soft">{title}</p>
      {children && <div className="mt-2 text-sm text-ink-muted">{children}</div>}
    </div>
  );
}

const BADGE_TONES = {
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  gray: 'bg-canvas text-ink-muted ring-line-strong',
  purple: 'bg-brand-50 text-brand-800 ring-brand-200',
  gold: 'bg-gold-100 text-gold-700 ring-gold-600/30',
  red: 'bg-red-50 text-red-700 ring-red-200',
} as const;

export function Badge({ tone = 'gray', children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BADGE_TONES[tone]}`}>{children}</span>;
}
