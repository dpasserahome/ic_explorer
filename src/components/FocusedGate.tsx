import { expression } from '../sim/logic';
import type { Bit, ChipDef } from '../sim/types';
import { GateBody, gateGeom } from './GateSymbol';
import { noPointerFocus } from './noPointerFocus';

const W = 460;
const H = 240;
const GATE_H = 120;
const GATE_X = 200;
const SWITCH_X = 14;
const SWITCH_W = 124;
const SWITCH_H = 64;
const BEND_X = 168;
const LAMP_X = 396;
const LAMP_R = 34;

interface Props {
  chip: ChipDef;
  values: Record<number, Bit>;
  focus: number;
  onFocus: (gateIndex: number) => void;
  onTogglePin: (pin: number) => void;
}

export function FocusedGate({ chip, values, focus, onFocus, onTogglePin }: Props) {
  const gate = chip.gates[focus];
  const n = gate.inputs.length;
  const geom = gateGeom(gate.kind, GATE_H);
  const top = (H - GATE_H) / 2;
  const yc = H / 2;
  const v = (p: number): Bit => values[p] ?? 0;
  const lv = (p: number) => (v(p) ? 'hi' : 'lo');
  const out = v(gate.output);
  const labels = chip.inputLabels.slice(0, n);
  const pinName = (p: number) => chip.pins.find((x) => x.num === p)!.name;

  // Switches are spread over the full height; wires bend into the gate's input slots.
  const switchY = (i: number) => (n === 1 ? yc : SWITCH_H / 2 + 8 + (i * (H - SWITCH_H - 16)) / (n - 1));

  return (
    <section className="panel focused">
      <div className="panel-title row">
        <span>Focused gate</span>
        <span className="gate-tabs" role="tablist" aria-label="Choose gate">
          {chip.gates.map((g, gi) => (
            <button
              key={g.id}
              role="tab"
              aria-selected={gi === focus}
              className={gi === focus ? 'tab on' : 'tab'}
              onClick={() => onFocus(gi)}
            >
              G{g.id}
            </button>
          ))}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="focused-svg" role="group" aria-label={`Gate ${gate.id}`}>
        {gate.inputs.map((pin, i) => {
          const localY = (GATE_H * (2 * i + 1)) / (2 * n);
          const sy = switchY(i);
          const d = `M${SWITCH_X + SWITCH_W},${sy} H${BEND_X} V${top + localY} H${GATE_X + geom.inputX(localY)}`;
          return <path key={pin} d={d} className={`wire big ${lv(pin)}`} />;
        })}
        <path d={`M${GATE_X + geom.outX},${yc} H${LAMP_X - LAMP_R}`} className={`wire big ${lv(gate.output)}`} />

        <g transform={`translate(${GATE_X},${top})`}>
          <GateBody geom={geom} className="gate-body big" />
        </g>
        <text x={GATE_X + GATE_H * 0.42} y={yc + 8} className="gate-kind">
          {gate.kind}
        </text>

        {gate.inputs.map((pin, i) => {
          const sy = switchY(i);
          const toggle = () => onTogglePin(pin);
          return (
            <g
              key={pin}
              className="switch"
              role="switch"
              aria-checked={v(pin) === 1}
              aria-label={`Input ${labels[i]}, pin ${pin}`}
              tabIndex={0}
              onMouseDown={noPointerFocus}
              onClick={toggle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle();
                }
              }}
            >
              <rect
                x={SWITCH_X}
                y={sy - SWITCH_H / 2}
                width={SWITCH_W}
                height={SWITCH_H}
                rx={12}
                className={`switch-box ${lv(pin)}`}
              />
              <text x={SWITCH_X + 16} y={sy + 2} className="switch-label">
                {labels[i]}
              </text>
              <text x={SWITCH_X + 16} y={sy + 22} className="switch-pin">
                pin {pin} · {pinName(pin)}
              </text>
              <text x={SWITCH_X + SWITCH_W - 18} y={sy + 13} className={`switch-value ${lv(pin)}`}>
                {v(pin)}
              </text>
            </g>
          );
        })}

        <circle cx={LAMP_X} cy={yc} r={LAMP_R} className={`lamp ${lv(gate.output)}`} />
        <text x={LAMP_X} y={yc + 12} className={`lamp-value ${lv(gate.output)}`}>
          {out}
        </text>
        <text x={LAMP_X} y={yc - LAMP_R - 12} className="lamp-label">
          {chip.outputLabel}
        </text>
        <text x={LAMP_X} y={yc + LAMP_R + 22} className="switch-pin" textAnchor="middle">
          pin {gate.output} · {pinName(gate.output)}
        </text>
      </svg>

      <div className="live-equation" aria-live="polite">
        {chip.outputLabel} = {expression(gate.kind, labels)} ={' '}
        {expression(gate.kind, gate.inputs.map((p) => String(v(p))))} ={' '}
        <span className={`eq-out ${lv(gate.output)}`}>{out}</span>
      </div>
    </section>
  );
}
