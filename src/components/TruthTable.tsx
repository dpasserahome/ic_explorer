import { truthTable } from '../sim/logic';
import type { Bit, ChipDef } from '../sim/types';

interface Props {
  chip: ChipDef;
  values: Record<number, Bit>;
  focus: number;
  onSetInputs: (gateIndex: number, bits: Bit[]) => void;
}

export function TruthTable({ chip, values, focus, onSetInputs }: Props) {
  const gate = chip.gates[focus];
  const rows = truthTable(gate.kind, gate.inputs.length);
  const current = gate.inputs.map((p) => values[p] ?? 0);
  const labels = chip.inputLabels.slice(0, gate.inputs.length);

  return (
    <section className="panel truth">
      <div className="panel-title">Truth table · Gate {gate.id}</div>
      <table className="truth-table">
        <thead>
          <tr>
            {labels.map((l) => (
              <th key={l}>{l}</th>
            ))}
            <th className="out-col">{chip.outputLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const on = row.inputs.every((b, i) => b === current[i]);
            const key = row.inputs.join('');
            return (
              <tr
                key={key}
                className={on ? 'on' : undefined}
                onClick={() => onSetInputs(focus, row.inputs)}
                tabIndex={0}
                aria-current={on ? 'true' : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSetInputs(focus, row.inputs);
                  }
                }}
              >
                {row.inputs.map((b, i) => (
                  <td key={i}>{b}</td>
                ))}
                <td className={`out-col ${row.output ? 'hi' : 'lo'}`}>{row.output}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
