import { CATALOG } from '../chips';
import { Icon } from './Icon';

interface Props {
  current: string;
  onSelect: (part: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function SideNav({ current, onSelect, collapsed, onToggle }: Props) {
  return (
    <nav className="sidenav" aria-label="Chips">
      <div className="nav-top">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="chip" size={18} />
          </span>
          <span className="brand-name">IC Explorer</span>
        </div>
      </div>
      {[...new Set(CATALOG.map((e) => e.group))].map((group) => (
        <div key={group} className="nav-section">
          <div className="nav-group">{group}</div>
          <ul>
            {CATALOG.filter((e) => e.group === group).map((entry) => (
              <li key={entry.part}>
                <button
                  className={entry.part === current ? 'nav-item on' : 'nav-item'}
                  disabled={!entry.chip}
                  aria-current={entry.part === current ? 'page' : undefined}
                  title={collapsed ? `${entry.part} ${entry.title}` : undefined}
                  onClick={() => onSelect(entry.part)}
                >
                  <span className="nav-part">{entry.part}</span>
                  <span className="nav-title">{entry.title}</span>
                  {!entry.chip && <span className="nav-soon">soon</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button
        className="nav-toggle"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand chip list' : 'Collapse chip list'}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        <Icon name={collapsed ? 'chevrons-right' : 'chevrons-left'} />
        <span className="nav-toggle-label">Collapse</span>
      </button>
    </nav>
  );
}
