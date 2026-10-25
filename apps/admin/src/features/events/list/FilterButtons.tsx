import type { FilterOption } from './event-list';

export function FilterButtons<T extends string>(props: {
  label: string;
  value: T | undefined;
  options: readonly FilterOption<T>[];
  onChange: (value: T | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={props.label}>
      <span className="mr-1 text-xs font-semibold text-ink-muted">{props.label}</span>
      {props.options.map((option) => {
        const active = option.value === props.value;
        return (
          <button
            key={option.value ?? 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => props.onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              active ? 'bg-brand-800 text-white' : 'border border-line-strong bg-white text-ink-soft hover:border-brand-700 hover:text-brand-800'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
