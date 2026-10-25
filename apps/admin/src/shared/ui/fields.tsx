import { useId, type ReactNode } from 'react';
import type { LocalizedText } from '@msc-web/content';
import type { IssueMap } from '../forms/issues';

/**
 * Form controls. Every control takes the server's IssueMap and its own field path, so an error appears under the
 * exact input it belongs to. Bilingual fields show Chinese and English side by side.
 * 表单控件。每个控件都接收服务器返回的 IssueMap 与自己的字段路径，错误因此显示在所属的输入框下方。双语字段将中文与英文并排显示。
 */

const INPUT =
  'block w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-muted/70 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-canvas aria-[invalid=true]:border-red-400';

export function Field(props: { label: string; htmlFor?: string; hint?: ReactNode; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={props.className}>
      <label htmlFor={props.htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {props.label}
        {props.required && <span className="ml-1 text-red-600">*</span>}
      </label>
      {props.children}
      {props.hint && !props.error && <p className="mt-1.5 text-xs text-ink-muted">{props.hint}</p>}
      {props.error && (
        <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
          {props.error}
        </p>
      )}
    </div>
  );
}

export function TextInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  issues: IssueMap;
  field: string;
  hint?: ReactNode;
  required?: boolean;
  type?: 'text' | 'email' | 'url' | 'password' | 'search';
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
  className?: string;
}) {
  const id = useId();
  const error = props.issues.get(props.field);
  return (
    <Field label={props.label} htmlFor={id} hint={props.hint} error={error} required={props.required} className={props.className}>
      <input
        id={id}
        type={props.type ?? 'text'}
        className={INPUT}
        value={props.value}
        placeholder={props.placeholder}
        maxLength={props.maxLength}
        autoComplete={props.autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </Field>
  );
}

export function Select<T extends string>(props: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  issues: IssueMap;
  field: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
}) {
  const id = useId();
  const error = props.issues.get(props.field);
  return (
    <Field label={props.label} htmlFor={id} hint={props.hint} error={error} required={props.required} className={props.className}>
      <select id={id} className={INPUT} value={props.value} aria-invalid={Boolean(error)} onChange={(event) => props.onChange(event.target.value as T)}>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox(props: { label: string; checked: boolean; onChange: (checked: boolean) => void; hint?: ReactNode; issues?: IssueMap; field?: string }) {
  const id = useId();
  const error = props.field ? props.issues?.get(props.field) : undefined;
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-line-strong text-brand-700 focus:ring-brand-200"
        checked={props.checked}
        aria-invalid={Boolean(error)}
        onChange={(event) => props.onChange(event.target.checked)}
      />
      <label htmlFor={id} className="text-sm">
        <span className="font-semibold text-ink">{props.label}</span>
        {props.hint && !error && <span className="mt-0.5 block text-xs text-ink-muted">{props.hint}</span>}
        {error && (
          <span className="mt-0.5 block text-xs font-medium text-red-700" role="alert">
            {error}
          </span>
        )}
      </label>
    </div>
  );
}

export function NumberInput(props: { label: string; value: number; onChange: (value: number) => void; issues: IssueMap; field: string; hint?: ReactNode; min?: number; max?: number; className?: string }) {
  const id = useId();
  const error = props.issues.get(props.field);
  return (
    <Field label={props.label} htmlFor={id} hint={props.hint} error={error} className={props.className}>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        className={INPUT}
        value={Number.isFinite(props.value) ? props.value : 0}
        min={props.min}
        max={props.max}
        aria-invalid={Boolean(error)}
        onChange={(event) => props.onChange(event.target.value === '' ? 0 : Math.trunc(Number(event.target.value)))}
      />
    </Field>
  );
}

/** A Toronto wall time "YYYY-MM-DDTHH:mm"; empty string means none. */
/** 多伦多本地时间 "YYYY-MM-DDTHH:mm"；空字符串表示未填写。 */
export function WallTimeInput(props: { label: string; value: string; onChange: (value: string) => void; issues: IssueMap; field: string; hint?: ReactNode; required?: boolean; className?: string }) {
  const id = useId();
  const error = props.issues.get(props.field);
  return (
    <Field label={props.label} htmlFor={id} hint={props.hint ?? '多伦多时间'} error={error} required={props.required} className={props.className}>
      <input id={id} type="datetime-local" step={300} className={INPUT} value={props.value} aria-invalid={Boolean(error)} onChange={(event) => props.onChange(event.target.value)} />
    </Field>
  );
}

export function DateInput(props: { label: string; value: string; onChange: (value: string) => void; issues: IssueMap; field: string; hint?: ReactNode; required?: boolean; className?: string }) {
  const id = useId();
  const error = props.issues.get(props.field);
  return (
    <Field label={props.label} htmlFor={id} hint={props.hint} error={error} required={props.required} className={props.className}>
      <input id={id} type="date" className={INPUT} value={props.value} aria-invalid={Boolean(error)} onChange={(event) => props.onChange(event.target.value)} />
    </Field>
  );
}

/**
 * One field in both languages. Either side may stay empty and the site falls back to the other, so only "at least
 * one" is ever required.
 * 一个字段的两种语言。任意一边都可以留空，网站会改用另一边，因此只要求 "至少填写一种"。
 */
export function LocalizedInput(props: {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  issues: IssueMap;
  field: string;
  hint?: ReactNode;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}) {
  const zhId = useId();
  const enId = useId();
  const zhError = props.issues.get(`${props.field}.zh`);
  const enError = props.issues.get(`${props.field}.en`);
  const control = (id: string, lang: 'zh' | 'en', error: string | undefined) => {
    const common = {
      id,
      lang: lang === 'zh' ? 'zh-CN' : 'en',
      className: `${INPUT}${props.multiline ? ' leading-relaxed' : ''}`,
      value: props.value[lang],
      maxLength: props.maxLength,
      'aria-invalid': Boolean(error),
    };
    return props.multiline ? (
      <textarea {...common} rows={props.rows ?? 4} onChange={(event) => props.onChange({ ...props.value, [lang]: event.target.value })} />
    ) : (
      <input {...common} type="text" onChange={(event) => props.onChange({ ...props.value, [lang]: event.target.value })} />
    );
  };
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-ink">
        {props.label}
        {props.required && <span className="ml-1 text-red-600">*</span>}
        {props.required && <span className="ml-2 text-xs font-normal text-ink-muted">至少填写一种语言</span>}
      </legend>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor={zhId} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            中文
          </label>
          {control(zhId, 'zh', zhError)}
          {zhError && (
            <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
              {zhError}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={enId} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
            English
          </label>
          {control(enId, 'en', enError)}
          {enError && (
            <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
              {enError}
            </p>
          )}
        </div>
      </div>
      {props.hint && <p className="mt-1.5 text-xs text-ink-muted">{props.hint}</p>}
    </fieldset>
  );
}
