import { useRef } from 'react';
import { useElementSize } from '../hooks/useElementSize';
import { evaluateChip, evaluateUnit } from '../sim/logic';
import type { Bit, ChipDef, TimingRowDef } from '../sim/types';
import { chipPresets, STEPS, type Explorer } from '../state/useExplorer';
import { BarredSvg } from './Barred';
import { Icon } from './Icon';

const LABEL_W = 120;
const RULER_H = 24;
const PAD_R = 10;
const BUS_SLANT = 5;
/** Rough width of one character of bus text, to hide text in runs too narrow for it. */
const BUS_CHAR_W = 7.5;
/** Rough character widths of the label column's small text and its bus value. */
const SUB_CHAR_W = 7;
const VALUE_CHAR_W = 10;
const VALUE_X = LABEL_W - 22;

/** A waveform row (bits) or, for a block chip's outputs, a bus row labelled per step (texts). */
type Row = {
  label: string;
  sub: string;
  /** Input index for flip-to-edit, or -1 for an output row. */
  input: number;
  bits?: Bit[];
  texts?: string[];
};

/** Runs of equal values as [start, end) step ranges. */
function runs(texts: string[]) {
  const out: { start: number; end: number; text: string }[] = [];
  texts.forEach((t, s) => {
    const last = out[out.length - 1];
    if (last && last.text === t) last.end = s + 1;
    else out.push({ start: s, end: s + 1, text: t });
  });
  return out;
}

export function TimingDiagram({ chip, ex }: { chip: ChipDef; ex: Explorer }) {
  const [wrapRef, { width, height }] = useElementSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  // A press anywhere starts a scrub. If it's released on the same step it started on, over an
  // input row, it's a click and flips that input instead.
  const press = useRef<{ step: number; input: number | null; moved: boolean } | null>(null);

  const pinName = (p: number) => chip.pins.find((x) => x.num === p)!.name;
  const block = chip.kind === 'block';
  let rows: Row[];

  if (chip.kind === 'block') {
    // Every pin's value at every step, so rows can show any pins, inputs or outputs, as bits or a bus.
    const stepValues = Array.from({ length: STEPS }, (_, s) => {
      const ins: Record<number, Bit> = {};
      for (const [p, w] of Object.entries(ex.pinWaves)) ins[Number(p)] = w[s];
      return evaluateChip(chip, ins);
    });
    const unitInputs = chip.units[ex.focus].inputs;
    const toRow = (def: TimingRowDef, isInput: boolean): Row => {
      const series = stepValues.map((v) => def.pins.map((p): Bit => v[p] ?? 0));
      if (def.pins.length === 1 && !def.format) {
        const input = isInput ? unitInputs.indexOf(def.pins[0]) : -1;
        return { label: def.label, sub: def.sub, bits: series.map((b) => b[0]), input };
      }
      return { label: def.label, sub: def.sub, texts: series.map(def.format!), input: -1 };
    };
    const { inputs, outputs } = chip.timing(ex.focus);
    rows = [...inputs.map((d) => toRow(d, true)), ...outputs.map((d) => toRow(d, false))];
  } else {
    const gate = chip.gates[ex.focus];
    const unitWaves = ex.waves[ex.focus];
    const outBits = Array.from({ length: STEPS }, (_, s) => evaluateUnit(chip, ex.focus, unitWaves.map((row) => row[s]))[0]);
    rows = [
      ...gate.inputs.map((pin, i) => ({
        label: chip.inputLabels[i],
        sub: `pin ${pin} · ${pinName(pin)}`,
        bits: unitWaves[i],
        input: i,
      })),
      { label: chip.outputLabel, sub: `pin ${gate.output} · ${pinName(gate.output)}`, bits: outBits, input: -1 },
    ];
  }
  // Block rows carry names like ~E1 or IA>B, so their small text starts after the longest name.
  const longest = Math.max(...rows.map((r) => r.label.replace(/~/g, '').length));
  const subX = block ? Math.min(74, 20 + longest * 10.5) : 36;
  // The bus row already prints its value at the cursor, so the label column shows it only where
  // it fits beside the small text (not beside the 7485's "A3–A0").
  const fitsValue = (row: Row) => {
    const len = row.texts![ex.cursor].replace(/~/g, '').length;
    return subX + row.sub.length * SUB_CHAR_W + 6 <= VALUE_X - (len * VALUE_CHAR_W) / 2 && len <= 4;
  };
  const title = !block
    ? `Timing diagram: gate ${chip.gates[ex.focus].id}`
    : chip.units.length > 1
      ? `Timing diagram: ${chip.units[ex.focus].label.toLowerCase()}`
      : 'Timing diagram';

  const tracksW = Math.max(100, width - LABEL_W - PAD_R);
  const slotW = tracksW / STEPS;
  const rowH = Math.max(block ? 22 : 26, (height - RULER_H - 4) / rows.length);
  const totalH = RULER_H + rowH * rows.length;
  const xAt = (s: number) => LABEL_W + s * slotW;
  const headW = Math.min(slotW - 4, 30);

  const stepFromEvent = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const s = Math.floor((e.clientX - rect.left - LABEL_W) / slotW);
    return Math.min(STEPS - 1, Math.max(0, s));
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const flip = (e.target as Element).closest('[data-flip]')?.getAttribute('data-flip');
    const s = stepFromEvent(e);
    press.current = { step: s, input: flip == null ? null : Number(flip), moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    ex.setCursor(s);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = press.current;
    if (!p) return;
    const s = stepFromEvent(e);
    if (s !== p.step) p.moved = true;
    ex.setCursor(s);
  };
  const onPointerUp = () => {
    const p = press.current;
    press.current = null;
    if (p && !p.moved && p.input !== null) ex.flip(ex.focus, p.input, p.step);
  };
  const cancelPress = () => (press.current = null);

  const wavePath = (bits: Bit[], yHi: number, yLo: number) => {
    const y = (b: Bit) => (b ? yHi : yLo);
    let d = `M${xAt(0)},${y(bits[0])}`;
    for (let s = 0; s < STEPS; s++) {
      d += ` H${xAt(s + 1)}`;
      if (s + 1 < STEPS && bits[s + 1] !== bits[s]) d += ` V${y(bits[s + 1])}`;
    }
    return d;
  };

  return (
    <section className="panel timing">
      <div className="panel-title row">
        <span>{title}</span>
        <span className="hint">
          Drag to scrub, click an input step to flip it, <kbd>←</kbd> <kbd>→</kbd> to step
        </span>
      </div>
      <div className="timing-wrap" ref={wrapRef}>
        {width > 0 && (
          <svg
            ref={svgRef}
            width={width}
            height={totalH}
            className="timing-svg"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={cancelPress}
          >
            {/* Cursor: a marker on the step number and a line through the step's middle */}
            <line
              x1={xAt(ex.cursor) + slotW / 2}
              x2={xAt(ex.cursor) + slotW / 2}
              y1={RULER_H - 4}
              y2={totalH}
              className="cursor-line"
            />
            <rect
              x={xAt(ex.cursor) + slotW / 2 - headW / 2}
              y={2}
              width={headW}
              height={RULER_H - 6}
              rx={(RULER_H - 6) / 2}
              className="cursor-head"
            />

            {/* Ruler + grid */}
            {Array.from({ length: STEPS }, (_, s) => (
              <g key={s}>
                <text
                  x={xAt(s) + slotW / 2}
                  y={RULER_H - 9}
                  className={s === ex.cursor ? 'ruler-num on' : 'ruler-num'}
                >
                  {s}
                </text>
                <line x1={xAt(s)} x2={xAt(s)} y1={RULER_H} y2={totalH} className="grid-line" />
              </g>
            ))}
            <line x1={xAt(STEPS)} x2={xAt(STEPS)} y1={RULER_H} y2={totalH} className="grid-line" />
            <text x={10} y={RULER_H - 9} className="ruler-caption">
              step
            </text>

            {rows.map((row, r) => {
              const y0 = RULER_H + r * rowH;
              const yHi = y0 + rowH * 0.2;
              const yLo = y0 + rowH * 0.8;
              const yMid = y0 + rowH / 2;
              return (
                <g key={row.label}>
                  <line x1={0} x2={xAt(STEPS)} y1={y0} y2={y0} className="row-line" />
                  <text x={12} y={yMid + 8} className={block ? 'row-label small' : 'row-label'}>
                    <BarredSvg text={row.label} />
                  </text>
                  <text x={subX} y={yMid + 6} className="row-pin">
                    <BarredSvg text={row.sub} />
                  </text>

                  {row.bits && (
                    <>
                      <text x={LABEL_W - 16} y={yMid + 9} className={`row-value ${row.bits[ex.cursor] ? 'hi' : 'lo'}`}>
                        {row.bits[ex.cursor]}
                      </text>
                      {row.bits.map((b, s) =>
                        b ? (
                          <rect key={s} x={xAt(s)} y={yHi} width={slotW} height={yLo - yHi} className="high-fill" />
                        ) : null,
                      )}
                      <path d={wavePath(row.bits, yHi, yLo)} className={`wave ${row.input < 0 ? 'out' : ''}`} />
                    </>
                  )}

                  {row.texts && (
                    <>
                      {fitsValue(row) && (
                        <text x={VALUE_X} y={yMid + 5} className="bus-value">
                          <BarredSvg text={row.texts[ex.cursor]} />
                        </text>
                      )}
                      {runs(row.texts).map((run) => {
                        const x0 = xAt(run.start);
                        const x1 = xAt(run.end);
                        const k = Math.min(BUS_SLANT, (x1 - x0) / 2);
                        return (
                          <g key={run.start}>
                            <path
                              d={`M${x0},${yMid} L${x0 + k},${yHi} H${x1 - k} L${x1},${yMid} L${x1 - k},${yLo} H${x0 + k} Z`}
                              className="bus"
                            />
                            {run.text.replace(/~/g, '').length * BUS_CHAR_W + 8 <= x1 - x0 && (
                              <text x={(x0 + x1) / 2} y={yMid + 4.5} className="bus-text">
                                <BarredSvg text={run.text} />
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </>
                  )}

                  {row.input >= 0 &&
                    row.bits!.map((_, s) => (
                      <rect
                        key={s}
                        data-flip={row.input}
                        x={xAt(s)}
                        y={y0 + 2}
                        width={slotW}
                        height={rowH - 4}
                        className="flip-target"
                      >
                        <title>{`Flip ${row.label.replace('~', '')} at step ${s}`}</title>
                      </rect>
                    ))}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="timing-controls">
        <div className="btn-row">
          <button className="icon-btn" onClick={() => ex.step(-1)} aria-label="Previous step">
            <Icon name="chevron-left" />
          </button>
          <button className="primary play" onClick={() => ex.setPlaying(!ex.playing)}>
            <Icon name={ex.playing ? 'pause' : 'play'} size={16} />
            {ex.playing ? 'Pause' : 'Play'}
          </button>
          <button className="icon-btn" onClick={() => ex.step(1)} aria-label="Next step">
            <Icon name="chevron-right" />
          </button>
          <span className="step-readout">
            Step <strong>{ex.cursor}</strong> of {STEPS - 1}
          </span>
        </div>
        <div className="btn-row">
          <span className="control-label">Inputs</span>
          <span className="segmented" role="radiogroup" aria-label="Input pattern">
            {chipPresets(chip).map((p) => (
              <button
                key={p.id}
                role="radio"
                aria-checked={ex.pattern === p.id}
                className={ex.pattern === p.id ? 'on' : undefined}
                onClick={() => ex.applyPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </span>
          {ex.pattern === null && <span className="badge">Edited</span>}
        </div>
      </div>
    </section>
  );
}
