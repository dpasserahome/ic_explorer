import { expression } from '../sim/logic';
import type { ChipDef } from '../sim/types';
import { Barred } from './Barred';

export function ChipHeader({ chip }: { chip: ChipDef }) {
  const formula =
    chip.kind === 'block' ? (
      <Barred text={chip.formula} />
    ) : (
      `${chip.outputLabel} = ${expression(chip.gates[0].kind, chip.inputLabels.slice(0, chip.gates[0].inputs.length))}`
    );
  return (
    <header className="panel chip-header">
      <div className="part">{chip.part}</div>
      <div className="title-block">
        <h1>{chip.title}</h1>
        <div className="badges">
          {chip.subtitle.split(' · ').map((s) => (
            <span key={s} className="badge">
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="equation-block">
        <div className="equation">{formula}</div>
        <div className="muted">“{chip.readAs}”</div>
      </div>
      <p className="overview">{chip.overview}</p>
    </header>
  );
}
