import { useRef } from 'react';
import { useElementSize } from '../hooks/useElementSize';
import { evaluateUnit } from '../sim/logic';
import type { Bit, ChipDef } from '../sim/types';
import { chipPresets, STEPS, type Explorer } from '../state/useExplorer';
import { BarredSvg } from './Barred';
import { Icon } from './Icon';

const LABEL_W = 120;
const RULER_H = 24;
const PAD_R = 10;
const BUS_SLANT = 5;

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

  const unitWaves = ex.waves[ex.focus];
  const outSteps = Array.from({ length: STEPS }, (_, s) =>
    evaluateUnit(chip, ex.focus, unitWaves.map((row) => row[s])),
  );
  const pinName = (p: number) => chip.pins.find((x) => x.num === p)!.name;
  const block = chip.kind === 'block';

  const rows: Row[] =
    chip.kind === 'block'
      ? [
          ...chip.inputs.map((pin, i) => ({ label: pinName(pin), sub: `pin ${pin}`, bits: unitWaves[i], input: i })),
          {
            label: chip.outputBus.label,
            sub: chip.outputBus.sub,
            texts: outSteps.map(chip.outputBus.format),
            input: -1,
          },
        ]
      : [
          ...chip.gates[ex.focus].inputs.map((pin, i) => ({
            label: chip.inputLabels[i],
            sub: `pin ${pin} · ${pinName(pin)}`,
            bits: unitWaves[i],
            input: i,
          })),
          {
            label: chip.outputLabel,
            sub: `pin ${chip.gates[ex.focus].output} · ${pinName(chip.gates[ex.focus].output)}`,
            bits: outSteps.map((o) => o[0]),
            input: -1,
          },
        ];
  // Block rows carry pin names like ~E1, so their pin numbers sit further right.
  const subX = block ? 50 : 36;
  const title = block ? 'Timing diagram' : `Timing diagram: gate ${chip.gates[ex.focus].id}`;

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
                      <text x={LABEL_W - 22} y={yMid + 5} className="bus-value">
                        <BarredSvg text={row.texts[ex.cursor]} />
                      </text>
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
                            <text x={(x0 + x1) / 2} y={yMid + 4.5} className="bus-text">
                              <BarredSvg text={run.text} />
                            </text>
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
