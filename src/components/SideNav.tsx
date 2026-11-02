import { CATALOG } from '../chips';

export function SideNav({ current, onSelect }: { current: string; onSelect: (part: string) => void }) {
  return (
    <nav className="sidenav" aria-label="Chips">
      <div className="brand">IC Explorer</div>
      <div className="nav-group">Basic gates</div>
      <ul>
        {CATALOG.map((entry) => (
          <li key={entry.part}>
            <button
              className={entry.part === current ? 'nav-item on' : 'nav-item'}
              disabled={!entry.chip}
              aria-current={entry.part === current ? 'page' : undefined}
              onClick={() => onSelect(entry.part)}
            >
              <span className="nav-part">{entry.part}</span>
              <span className="nav-title">{entry.title}</span>
              {!entry.chip && <span className="nav-soon">soon</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
