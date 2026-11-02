import { useState } from 'react';
import { describeGate, describePin } from '../sim/describe';
import type { Bit, GateChipDef, GateDef } from '../sim/types';
import { GateBody, gateGeom } from './GateSymbol';
import { Icon } from './Icon';
import { noPointerFocus } from './noPointerFocus';

// Fixed drawing space; the SVG scales uniformly to fit its panel.
const W = 600;
const H = 456;
const PKG_L = 110;
const PKG_R = W - PKG_L;
const PKG_T = 14;
const PKG_B = 442;
const PITCH = 58;
const Y0 = 56;
const PIN_W = 36;
const PIN_H = 30;
const GATE_H = 50;
const GATE_X = 180; // left edge of a left-side gate
const BEND_X = 140; // where input wires turn toward the gate
const OUT_X = 268; // where the output wire turns back toward its pin

type Side = 'L' | 'R';

function pinSide(num: number, count: number): Side {
  return num <= count / 2 ? 'L' : 'R';
}
function pinY(num: number, count: number) {
  return num <= count / 2 ? Y0 + (num - 1) * PITCH : Y0 + (count - num) * PITCH;
}
/** Mirror x for gates on the right side of the package. */
const mx = (side: Side, x: number) => (side === 'L' ? x : W - x);

function layoutGate(gate: GateDef, count: number) {
  const side = pinSide(gate.inputs[0], count);
  const pinYs = gate.inputs.map((p) => pinY(p, count));
  const yc = pinYs.reduce((a, b) => a + b) / pinYs.length;
  const top = yc - GATE_H / 2;
  const geom = gateGeom(gate.kind, GATE_H);
  const n = gate.inputs.length;

  // Assign gate input slots top-to-bottom by pin position so wires never cross.
  const order = gate.inputs.map((_, i) => i).sort((a, b) => pinYs[a] - pinYs[b]);
  const inputPaths = gate.inputs.map((pin, i) => {
    const slot = order.indexOf(i);
    const localY = (GATE_H * (2 * slot + 1)) / (2 * n);
    const yIn = top + localY;
    const xEnd = GATE_X + geom.inputX(localY);
    return {
      pin,
      d: `M${mx(side, PKG_L)},${pinYs[i]} H${mx(side, BEND_X)} V${yIn} H${mx(side, xEnd)}`,
    };
  });

  const yOut = pinY(gate.output, count);
  const outPath = `M${mx(side, GATE_X + geom.outX)},${yc} H${mx(side, OUT_X)} V${yOut} H${mx(side, PKG_L)}`;

  const transform =
    side === 'L' ? `translate(${GATE_X},${top})` : `translate(${W - GATE_X},${top}) scale(-1,1)`;

  const allYs = [...pinYs, yOut];
  const hitX = [mx(side, BEND_X - 14), mx(side, OUT_X + 14)].sort((a, b) => a - b);
  const haloX = [mx(side, GATE_X - 10), mx(side, GATE_X + geom.outX + 10)].sort((a, b) => a - b);

  return {
    side,
    yc,
    top,
    geom,
    transform,
    inputPaths,
    outPath,
    labelX: mx(side, GATE_X + GATE_H * 0.4),
    hit: { x: hitX[0], y: Math.min(...allYs) - 22, w: hitX[1] - hitX[0], h: Math.max(...allYs) - Math.min(...allYs) + 44 },
    halo: { x: haloX[0], y: top - 10, w: haloX[1] - haloX[0], h: GATE_H + 20 },
  };
}

interface Props {
  chip: GateChipDef;
  values: Record<number, Bit>;
  focus: number;
  onFocus: (gateIndex: number) => void;
  onTogglePin: (pin: number) => void;
}

export function ChipView({ chip, values, focus, onFocus, onTogglePin }: Props) {
  const [hoverPin, setHoverPin] = useState<number | null>(null);
  const [hoverGate, setHoverGate] = useState<number | null>(null);
  // A clicked pin stays selected only while the gate focus it was clicked under is unchanged.
  const [selection, setSelection] = useState<{ pin: number; focus: number } | null>(null);
  const selectedPin = selection && selection.focus === focus ? selection.pin : null;

  const count = chip.pins.length;
  const gateOfPin = (p: number) => chip.gates.findIndex((g) => g.inputs.includes(p) || g.output === p);
  const layouts = chip.gates.map((g) => layoutGate(g, count));

  // Which gate's signal path is being traced (-1 = a power pin, which belongs to every gate).
  const traced = hoverGate ?? (hoverPin !== null ? gateOfPin(hoverPin) : null);
  const dim = (gi: number) => traced !== null && traced >= 0 && gi !== traced;
  const v = (p: number): Bit => values[p] ?? 0;
  const lv = (p: number) => (v(p) ? 'hi' : 'lo');

  // Hover wins over the selection, so hovering a gate explains it even while a pin is selected.
  const inspectorPin = hoverPin ?? (hoverGate === null ? selectedPin : null);
  const info =
    inspectorPin !== null
      ? describePin(chip, inspectorPin, values)
      : hoverGate !== null
        ? describeGate(chip, hoverGate)
        : null;

  const clickPin = (p: number, role: string) => {
    if (role === 'input') onTogglePin(p);
    const gi = gateOfPin(p);
    if (gi >= 0) onFocus(gi);
    setSelection({ pin: p, focus: gi >= 0 ? gi : focus });
  };
  const clickGate = (gi: number) => {
    setSelection(null);
    onFocus(gi);
  };

  return (
    <section className="panel chip-view">
      <div className="panel-title">Pin diagram</div>
      <div className="chip-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="chip-svg" role="group" aria-label={`${chip.part} pin diagram`}>
          {/* Package */}
          <rect x={PKG_L} y={PKG_T} width={PKG_R - PKG_L} height={PKG_B - PKG_T} rx={8} className="package" />
          <path d={`M${W / 2 - 18},${PKG_T} A18,18 0 0 0 ${W / 2 + 18},${PKG_T}`} className="notch" />
          <text x={W / 2} y={PKG_B - 14} className="package-label">
            {chip.part}
          </text>

          {/* Gates and wiring */}
          {chip.gates.map((gate, gi) => {
            const L = layouts[gi];
            return (
              <g key={gate.id} className={dim(gi) ? 'gate-group dim' : 'gate-group'}>
                <rect
                  {...{ x: L.hit.x, y: L.hit.y, width: L.hit.w, height: L.hit.h }}
                  className="gate-hit"
                  onMouseEnter={() => setHoverGate(gi)}
                  onMouseLeave={() => setHoverGate(null)}
                  onClick={() => clickGate(gi)}
                />
                {gi === focus && (
                  <rect x={L.halo.x} y={L.halo.y} width={L.halo.w} height={L.halo.h} rx={8} className="focus-halo" />
                )}
                {L.inputPaths.map((ip) => (
                  <path key={ip.pin} d={ip.d} className={`wire ${lv(ip.pin)}`} />
                ))}
                <path d={L.outPath} className={`wire ${lv(gate.output)}`} />
                <g transform={L.transform}>
                  <GateBody geom={L.geom} />
                </g>
                <text x={L.labelX} y={L.yc + 5} className="gate-label">
                  G{gate.id}
                </text>
              </g>
            );
          })}

          {/* Pins */}
          {chip.pins.map((pin) => {
            const side = pinSide(pin.num, count);
            const y = pinY(pin.num, count);
            const gi = gateOfPin(pin.num);
            const isPower = pin.role === 'vcc' || pin.role === 'gnd';
            const boxX = side === 'L' ? PKG_L - PIN_W : PKG_R;
            const valueX = side === 'L' ? PKG_L - PIN_W - 22 : PKG_R + PIN_W + 22;
            const nameX = side === 'L' ? PKG_L + 8 : PKG_R - 8;
            const state = isPower ? pin.role : lv(pin.num);
            const classes = ['pin', state, pin.role === 'input' ? 'clickable' : '', inspectorPin === pin.num ? 'selected' : '']
              .filter(Boolean)
              .join(' ');
            return (
              <g
                key={pin.num}
                className={gi >= 0 && dim(gi) ? 'pin-group dim' : 'pin-group'}
                onMouseEnter={() => setHoverPin(pin.num)}
                onMouseLeave={() => setHoverPin(null)}
                onMouseDown={noPointerFocus}
                onClick={() => clickPin(pin.num, pin.role)}
                role="button"
                tabIndex={0}
                aria-label={`Pin ${pin.num}, ${pin.name}${isPower ? '' : `, value ${v(pin.num)}`}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    clickPin(pin.num, pin.role);
                  }
                }}
                onFocus={() => setHoverPin(pin.num)}
                onBlur={() => setHoverPin(null)}
              >
                <rect x={boxX} y={y - PIN_H / 2} width={PIN_W} height={PIN_H} rx={3} className={classes} />
                <text x={boxX + PIN_W / 2} y={y + 5} className="pin-num">
                  {pin.num}
                </text>
                <text
                  x={nameX}
                  y={isPower ? y + 5 : y - 9}
                  className="pin-name"
                  textAnchor={side === 'L' ? 'start' : 'end'}
                >
                  {pin.name}
                </text>
                {!isPower && (
                  <text x={valueX} y={y + 7} className={`pin-value ${lv(pin.num)}`}>
                    {v(pin.num)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="inspector" aria-live="polite">
        <Icon name="info" size={16} />
        {info ? (
          <p>
            <strong>{info.title}:</strong> {info.body}
          </p>
        ) : (
          <p className="muted">
            Hover or click a pin to trace its signal. Click an input pin to toggle it. Click a gate to focus it.
          </p>
        )}
      </div>
    </section>
  );
}
