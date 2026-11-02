import { useEffect, useState } from 'react';
import { CATALOG } from './chips';
import { ChipHeader } from './components/ChipHeader';
import { ChipView } from './components/ChipView';
import { FocusedGate } from './components/FocusedGate';
import { SideNav } from './components/SideNav';
import { TimingDiagram } from './components/TimingDiagram';
import { TruthTable } from './components/TruthTable';
import type { ChipDef } from './sim/types';
import { useExplorer } from './state/useExplorer';

export function App() {
  const [part, setPart] = useState('7408');
  const chip = CATALOG.find((c) => c.part === part)!.chip!;

  return (
    <div className="app">
      <SideNav current={part} onSelect={setPart} />
      {/* Keyed so switching chips starts with fresh state. */}
      <Explorer key={chip.part} chip={chip} />
    </div>
  );
}

function Explorer({ chip }: { chip: ChipDef }) {
  const ex = useExplorer(chip);
  const { step, setPlaying } = ex;

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
