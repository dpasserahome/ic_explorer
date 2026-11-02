import { useState } from 'react';
import { describeBlockPin } from '../sim/describe';
import type { Bit, BlockChipDef } from '../sim/types';
import { Barred, BarredSvg, plainText } from './Barred';
import { Icon } from './Icon';
import { pinRadius } from './pinShape';
import { noPointerFocus } from './noPointerFocus';

// Fixed drawing width; the height follows the pin count. The SVG scales uniformly to fit its panel.
const W = 440;
const PKG_L = 90;
const PKG_R = W - PKG_L;
const PKG_T = 14;
const PITCH = 62;
const Y0 = 50;
const PIN_W = 36;
const PIN_H = 28;
const BLK_INSET = 58; // from the package edge to the function block
const BLK_L = PKG_L + BLK_INSET;
const BLK_R = PKG_R - BLK_INSET;
const BUBBLE_R = 6;

interface Props {
  chip: BlockChipDef;
  values: Record<number, Bit>;
  onTogglePin: (pin: number) => void;
  /** The pin whose logic the Logic tab shows (outlined). */
  focusedPin: number;
  /** Any signal pin was clicked (after an input pin is toggled). */
  onPinClick: (pin: number) => void;
}

/** Pin diagram for an MSI chip: the package with one function block wired to every signal pin. */
export function BlockView({ chip, values, onTogglePin, focusedPin, onPinClick }: Props) {
  const [hoverPin, setHoverPin] = useState<number | null>(null);
  const [selectedPin, setSelectedPin] = useState<number | null>(null);

  const count = chip.pins.length;
  const perSide = count / 2;
  const side = (num: number) => (num <= perSide ? 'L' : 'R');
  const pinY = (num: number) => (num <= perSide ? Y0 + (num - 1) * PITCH : Y0 + (count - num) * PITCH);
  const lastY = Y0 + (perSide - 1) * PITCH;
  const pkgB = lastY + 32;
  const H = pkgB + PKG_T;
  const blkT = Y0 - 24;
  const blkB = lastY + 24;

  const v = (p: number): Bit => values[p] ?? 0;
  const lv = (p: number) => (v(p) ? 'hi' : 'lo');

  const inspectorPin = hoverPin ?? selectedPin;
  const info = inspectorPin !== null ? describeBlockPin(chip, inspectorPin, values) : null;

  const clickPin = (p: number, role: string) => {
    if (role === 'input') onTogglePin(p);
    if (role === 'input' || role === 'output') onPinClick(p);
    setSelectedPin(p);
  };

  return (
    <section className="panel chip-view">
      <div className="panel-title">Pin diagram</div>
      <div className="chip-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="chip-svg" role="group" aria-label={`${chip.part} pin diagram`}>
          <rect x={PKG_L} y={PKG_T} width={PKG_R - PKG_L} height={pkgB - PKG_T} rx={8} className="package" />
          <path d={`M${W / 2 - 18},${PKG_T} A18,18 0 0 0 ${W / 2 + 18},${PKG_T}`} className="notch" />

          {/* Wires from each signal pin to the block, with a bubble where the signal is active LOW */}
          {chip.pins
            .filter((p) => p.role === 'input' || p.role === 'output')
            .map((pin) => {
              const y = pinY(pin.num);
              const left = side(pin.num) === 'L';
              const edge = left ? BLK_L : BLK_R;
              const bar = pin.name.startsWith('~');
              const end = bar ? edge + (left ? -2 * BUBBLE_R : 2 * BUBBLE_R) : edge;
              return (
                <g key={pin.num}>
                  <path d={`M${left ? PKG_L : PKG_R},${y} H${end}`} className={`wire ${lv(pin.num)}`} />
                  {bar && (
                    <circle cx={edge + (left ? -BUBBLE_R : BUBBLE_R)} cy={y} r={BUBBLE_R} className="gate-body bubble" />
                  )}
                </g>
              );
            })}

          <rect x={BLK_L} y={blkT} width={BLK_R - BLK_L} height={blkB - blkT} rx={6} className="gate-body" />
          <text x={W / 2} y={(blkT + blkB) / 2 - 6} className="block-label">
            {chip.blockLabel}
          </text>
          <text x={W / 2} y={(blkT + blkB) / 2 + 18} className="package-label">
            {chip.part}
          </text>

          {chip.pins.map((pin) => {
            const left = side(pin.num) === 'L';
            const y = pinY(pin.num);
            // Power and not-connected pins carry no logic value.
            const isPower = pin.role === 'vcc' || pin.role === 'gnd' || pin.role === 'nc';
            const boxX = left ? PKG_L - PIN_W : PKG_R;
            const valueX = left ? PKG_L - PIN_W - 22 : PKG_R + PIN_W + 22;
            const nameX = left ? PKG_L + 8 : PKG_R - 8;
            const state = isPower ? pin.role : lv(pin.num);
            const focused = pin.num === focusedPin;
            const classes = [
              'pin',
              state,
              pin.role === 'input' ? 'clickable' : '',
              inspectorPin === pin.num || focused ? 'selected' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g
                key={pin.num}
                className={`pin-group ${pin.role}`}
                onMouseEnter={() => setHoverPin(pin.num)}
                onMouseLeave={() => setHoverPin(null)}
                onMouseDown={noPointerFocus}
                onClick={() => clickPin(pin.num, pin.role)}
                role="button"
                tabIndex={0}
                aria-label={`Pin ${pin.num}, ${plainText(pin.name)}${isPower ? '' : `, value ${v(pin.num)}`}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    clickPin(pin.num, pin.role);
                  }
                }}
                onFocus={() => setHoverPin(pin.num)}
                onBlur={() => setHoverPin(null)}
              >
                <rect x={boxX} y={y - PIN_H / 2} width={PIN_W} height={PIN_H} rx={pinRadius(pin.role, PIN_H)} className={classes} />
                <text x={boxX + PIN_W / 2} y={y + 5} className="pin-num">
                  {pin.num}
                </text>
                <text x={nameX} y={isPower ? y + 5 : y - 9} className="pin-name" textAnchor={left ? 'start' : 'end'}>
                  <BarredSvg text={pin.name} />
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
            <strong>
              <Barred text={info.title} />:
            </strong>{' '}
            <Barred text={info.body} />
          </p>
        ) : (
          <p className="muted">
            Square pins are inputs: click one to toggle it. Round pins are outputs, driven by the chip: click one
            to see its logic.
          </p>
        )}
      </div>
    </section>
  );
}
