import { useEffect, useState } from 'react';
import { CATALOG } from './chips';
import { BlockView } from './components/BlockView';
import { ChipHeader } from './components/ChipHeader';
import { ChipView } from './components/ChipView';
import { FocusedGate } from './components/FocusedGate';
import { FunctionTable, type BlockTab } from './components/FunctionTable';
import { SideNav } from './components/SideNav';
import { TimingDiagram } from './components/TimingDiagram';
import { TruthTable } from './components/TruthTable';
import type { ChipDef } from './sim/types';
import { useExplorer } from './state/useExplorer';

const NAV_KEY = 'ic-explorer.nav-collapsed';

function readNavCollapsed() {
  try {
    return localStorage.getItem(NAV_KEY) === '1';
  } catch {
    return false;
  }
}

export function App() {
  const [part, setPart] = useState('7408');
  const [navCollapsed, setNavCollapsed] = useState(readNavCollapsed);
  const chip = CATALOG.find((c) => c.part === part)!.chip!;

  const toggleNav = () => {
    setNavCollapsed((c) => {
      try {
        localStorage.setItem(NAV_KEY, c ? '0' : '1');
      } catch {
        // Storage can be blocked; the toggle still works for this visit.
      }
      return !c;
    });
  };

  return (
    <div className={navCollapsed ? 'app nav-collapsed' : 'app'}>
      <SideNav current={part} onSelect={setPart} collapsed={navCollapsed} onToggle={toggleNav} />
      {/* Keyed so switching chips starts with fresh state. */}
      <Explorer key={chip.part} chip={chip} />
    </div>
  );
}

function Explorer({ chip }: { chip: ChipDef }) {
  const ex = useExplorer(chip);
  const { step, setPlaying } = ex;
  // Block chips: which right-hand tab shows, and which Logic view (an index into chip.logic(focus)).
  const [tab, setTab] = useState<BlockTab>('logic');
  const [view, setView] = useState(0);

  // Lecture shortcuts: ← → step through time, space plays/pauses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as Element;
      if (t.closest('input, textarea')) return;
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      // Space still activates whichever control has keyboard focus.
      else if (e.key === ' ' && !t.closest('button, [tabindex]')) {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, setPlaying]);

  // MSI chips: a tall pin diagram on the left; Logic / Function table tabs and timing on the right.
  if (chip.kind === 'block') {
    const views = chip.logic(ex.focus);
    const focusUnit = (u: number) => {
      ex.setFocus(u);
      setView(0);
    };
    // A clicked pin opens its own Logic view if it has one, in its own unit (shared pins stay put).
    const onPinClick = (p: number) => {
      const owners = chip.units.flatMap((u, k) => (u.inputs.includes(p) || u.outputs.includes(p) ? [k] : []));
      const u = owners.length === 1 ? owners[0] : ex.focus;
      const unitViews = chip.logic(u);
      let k = unitViews.findIndex((v) => (v.pin ?? v.out) === p);
      if (k < 0) k = unitViews.findIndex((v) => v.out === p);
      if (u !== ex.focus) ex.setFocus(u);
      if (k >= 0) {
        setView(k);
        setTab('logic');
      } else if (u !== ex.focus) setView(0);
    };
    return (
      <main className="explorer block">
        <ChipHeader chip={chip} />
        <div className="block-body">
          <BlockView
            chip={chip}
            values={ex.values}
            onTogglePin={ex.togglePin}
            focusedPin={views[Math.min(view, views.length - 1)].out}
            onPinClick={onPinClick}
          />
          <div className="block-right">
            <FunctionTable
              chip={chip}
              values={ex.values}
              focus={ex.focus}
              onFocus={focusUnit}
              onSetInputs={ex.setGateInputs}
              tab={tab}
              onTab={setTab}
              view={view}
              onView={setView}
              onTogglePin={ex.togglePin}
            />
            <TimingDiagram chip={chip} ex={ex} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="explorer">
      <ChipHeader chip={chip} />
      <div className="middle">
        <ChipView
          chip={chip}
          values={ex.values}
          focus={ex.focus}
          onFocus={ex.setFocus}
          onTogglePin={ex.togglePin}
        />
        <div className="right-col">
          <FocusedGate
            chip={chip}
            values={ex.values}
            focus={ex.focus}
            onFocus={ex.setFocus}
            onTogglePin={ex.togglePin}
          />
          <TruthTable chip={chip} values={ex.values} focus={ex.focus} onSetInputs={ex.setGateInputs} />
        </div>
      </div>
      <TimingDiagram chip={chip} ex={ex} />
    </main>
  );
}
