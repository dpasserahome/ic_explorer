import { functionTable, matchesRow } from '../sim/logic';
import type { Bit, BlockChipDef } from '../sim/types';
import { Barred } from './Barred';
import { noPointerFocus } from './noPointerFocus';

interface Props {
  chip: BlockChipDef;
  values: Record<number, Bit>;
  onSetInputs: (unit: number, bits: Bit[]) => void;
}

/** The datasheet's function table (X = don't care), with computed outputs and the live state. */
export function FunctionTable({ chip, values, onSetInputs }: Props) {
  const rows = functionTable(chip);
  const current = chip.inputs.map((p): Bit => values[p] ?? 0);
  const outs = chip.outputs.map((p): Bit => values[p] ?? 0);
  // Several don't-care rows can match; highlight the first, as the datasheet would be read.
  const on = rows.findIndex((r) => matchesRow(r.inputs, current));
  const name = (p: number) => chip.pins.find((x) => x.num === p)!.name;
  // Clicking a row sets its inputs and leaves don't-care inputs as they are.
  const apply = (pattern: (Bit | 'X')[]) => onSetInputs(0, pattern.map((b, i) => (b === 'X' ? current[i] : b)));

  return (
    <section className="panel truth function">
      <div className="panel-title row">
        <span>Function table</span>
        <span className="hint">X = don’t care · click a row to set the inputs</span>
      </div>
      <table className="truth-table function-table">
        <thead>
          <tr>
            {chip.inputs.map((p) => (
              <th key={p}>
                <Barred text={name(p)} />
              </th>
            ))}
            {chip.outputs.map((p, i) => (
              <th key={p} className={i === 0 ? 'out-col' : undefined}>
                <Barred text={name(p)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr
              key={r}
              className={r === on ? 'on' : undefined}
              onMouseDown={noPointerFocus}
              onClick={() => apply(row.inputs)}
              tabIndex={0}
              aria-current={r === on ? 'true' : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  apply(row.inputs);
                }
              }}
            >
              {row.inputs.map((b, i) => (
                <td key={i} className={b === 'X' ? 'dc' : undefined}>
                  {b}
                </td>
              ))}
              {row.outputs.map((b, i) => (
                <td key={`o${i}`} className={`${i === 0 ? 'out-col ' : ''}${b ? 'hi' : 'lo'}`}>
                  {b}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="status-line" aria-live="polite">
        <Barred text={chip.status(current, outs)} />
      </div>
    </section>
  );
}
