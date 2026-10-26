import { useId } from 'react';
import { Link } from 'react-router-dom';
import type { SummaryCard } from './summary-cards';

export function SummaryCards({ cards }: { cards: readonly SummaryCard[] }) {
  const headingId = useId();
  if (cards.length === 0) return null;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-base font-bold text-brand-900">
        内容概况
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <li key={card.to}>
            <Link
              to={card.to}
              className="block h-full rounded-xl border border-line bg-white p-5 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50"
            >
              <span className="block text-sm font-semibold text-ink-soft">{card.title}</span>
              <span className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-brand-900">{card.value}</span>
                <span className="text-sm text-ink-muted">{card.unit}</span>
              </span>
              {card.detail && <span className="mt-1 block text-xs text-ink-muted">{card.detail}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
