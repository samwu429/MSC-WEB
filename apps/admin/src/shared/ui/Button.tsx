import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'md' | 'sm';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-700/50',
  secondary: 'border border-line-strong bg-white text-brand-800 hover:border-brand-700 hover:bg-brand-50 disabled:opacity-50',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50 hover:border-red-300 disabled:opacity-50',
  ghost: 'text-ink-soft hover:bg-brand-50 hover:text-brand-800 disabled:opacity-50',
};

const SIZES: Record<Size, string> = {
  md: 'min-h-10 px-4 py-2 text-sm',
  sm: 'min-h-8 px-3 py-1.5 text-[13px]',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md'): string {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]}`;
}

export function Button({ variant = 'primary', size = 'md', busy = false, className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; busy?: boolean; children: ReactNode }) {
  return (
    <button type="button" {...props} disabled={props.disabled || busy} aria-busy={busy || undefined} className={`${buttonClass(variant, size)} ${className}`}>
      {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function LinkButton({ variant = 'secondary', size = 'md', className = '', ...props }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={`${buttonClass(variant, size)} ${className}`} />;
}
