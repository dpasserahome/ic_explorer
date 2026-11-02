import { expression } from '../sim/logic';
import type { ChipDef } from '../sim/types';

export function ChipHeader({ chip }: { chip: ChipDef }) {
  const g = chip.gates[0];
  return (
    <header className="panel chip-header">
      <div className="part">{chip.part}</div>
      <div className="title-block">
        <h1>{chip.title}</h1>
        <div className="muted">{chip.subtitle}</div>
      </div>
      <div className="equation-block">
        <div className="equation">
          {chip.outputLabel} = {expression(g.kind, chip.inputLabels.slice(0, g.inputs.length))}
        </div>
        <div className="muted">“{chip.readAs}”</div>
      </div>
      <p className="overview">{chip.overview}</p>
    </header>
  );
}
