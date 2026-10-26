import { Link } from 'react-router-dom';
import { mediaUrl, type Person } from '@msc-web/content';
import { LinkButton } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/feedback';
import { personTitle, photoPlaceholder } from './people-board';

function PersonThumbnail({ person }: { person: Person }) {
  if (person.photoKey) {
    return <img src={mediaUrl(person.photoKey)} alt="" loading="lazy" className="h-10 w-8 shrink-0 rounded object-cover" />;
  }
  return (
    <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-brand-100 text-sm font-bold text-brand-800" aria-hidden="true">
      {photoPlaceholder(person.name)}
    </span>
  );
}

function PersonRow({ person }: { person: Person }) {
  const primary = person.name.en.trim() || '未填写英文姓名';
  return (
    <Link to={`/people/${person.id}`} className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-brand-50">
      <PersonThumbnail person={person} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${person.name.en.trim() ? 'text-ink' : 'text-red-700'}`}>{primary}</span>
        <span className="block truncate text-xs text-ink-muted">{personTitle(person)}</span>
      </span>
      {!person.visible && <Badge>已隐藏</Badge>}
      <span className="text-ink-muted" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

export function PersonRows({ people, emptyLabel }: { people: readonly Person[]; emptyLabel: string }) {
  if (people.length === 0) return <p className="px-3 py-3 text-sm text-ink-muted">{emptyLabel}</p>;
  return (
    <ul className="divide-y divide-line">
      {people.map((person) => (
        <li key={person.id}>
          <PersonRow person={person} />
        </li>
      ))}
    </ul>
  );
}

/**
 * One office with its holders and a link that opens a new entry already set to that office. `addLabel` names the
 * office in full, such as "添加学术部副部长", because the visible heading repeats in every department.
 * 一个职位及其担任者，并附带一个打开已预设该职位的新条目的链接。`addLabel` 写出完整职位，例如 "添加学术部副部长"，因为可见标题在每个部门中都会重复。
 */
export function OfficeSlot(props: {
  label: string;
  addLabel: string;
  people: readonly Person[];
  addTo: string;
  emptyLabel: string;
  heading?: 'h3' | 'h4';
}) {
  const Heading = props.heading ?? 'h3';
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-canvas/60 px-3 py-1.5">
        <Heading className="text-sm font-semibold text-ink">{props.label}</Heading>
        <LinkButton to={props.addTo} variant="ghost" size="sm" aria-label={props.addLabel}>
          添加
        </LinkButton>
      </div>
      <PersonRows people={props.people} emptyLabel={props.emptyLabel} />
    </div>
  );
}
