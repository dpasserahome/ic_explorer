import { useRef } from 'react';
import { useElementSize } from '../hooks/useElementSize';
import { evalGate } from '../sim/logic';
import type { Bit, ChipDef } from '../sim/types';
import { STEPS, type Explorer, type Preset } from '../state/useExplorer';

const LABEL_W = 120;
const RULER_H = 24;
const PAD_R = 10;

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'sweep', label: 'All combinations' },
  { id: 'enable', label: 'Clock + enable' },
  { id: 'random', label: 'Random' },
  { id: 'clear', label: 'Clear' },
];

export function TimingDiagram({ chip, ex }: { chip: ChipDef; ex: Explorer }) {
  const [wrapRef, { width, height }] = useElementSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const scrubbing = useRef(false);

  const gate = chip.gates[ex.focus];
  const gateWaves = ex.waves[ex.focus];
  const outBits = Array.from({ length: STEPS }, (_, s) =>
    evalGate(gate.kind, gateWaves.map((row) => row[s])),
  );
  const pinName = (p: number) => chip.pins.find((x) => x.num === p)!.name;

  const rows = [
    ...gate.inputs.map((pin, i) => ({ label: chip.inputLabels[i], pin, bits: gateWaves[i], input: i })),
    { label: chip.outputLabel, pin: gate.output, bits: outBits, input: -1 },
  ];

  const tracksW = Math.max(100, width - LABEL_W - PAD_R);
  const slotW = tracksW / STEPS;
  const rowH = Math.max(30, (height - RULER_H - 4) / rows.length);
  const totalH = RULER_H + rowH * rows.length;
  const xAt = (s: number) => LABEL_W + s * slotW;

  const stepFromEvent = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const s = Math.floor((e.clientX - rect.left - LABEL_W) / slotW);
    return Math.min(STEPS - 1, Math.max(0, s));
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('[data-flip]')) return;
    scrubbing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    ex.setCursor(stepFromEvent(e));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (scrubbing.current) ex.setCursor(stepFromEvent(e));
  };
  const endScrub = () => (scrubbing.current = false);

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
      <div className="panel-title">Timing diagram · Gate {gate.id}</div>
      <div className="timing-wrap" ref={wrapRef}>
        {width > 0 && (
          <svg
            ref={svgRef}
            width={width}
            height={totalH}
            className="timing-svg"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endScrub}
            onPointerCancel={endScrub}
          >
            {/* Cursor column */}
            <rect x={xAt(ex.cursor)} y={0} width={slotW} height={totalH} className="cursor-band" />
            <rect x={xAt(ex.cursor)} y={0} width={slotW} height={RULER_H - 4} rx={4} className="cursor-head" />

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
              const val = row.bits[ex.cursor];
              const lv = val ? 'hi' : 'lo';
              return (
                <g key={row.label}>
                  <line x1={0} x2={xAt(STEPS)} y1={y0} y2={y0} className="row-line" />
                  <text x={12} y={y0 + rowH / 2 + 8} className="row-label">
                    {row.label}
                  </text>
                  <text x={36} y={y0 + rowH / 2 + 6} className="row-pin">
                    pin {row.pin} · {pinName(row.pin)}
                  </text>
                  <text x={LABEL_W - 16} y={y0 + rowH / 2 + 9} className={`row-value ${lv}`}>
                    {val}
                  </text>

                  {row.bits.map((b, s) =>
                    b ? (
                      <rect key={s} x={xAt(s)} y={yHi} width={slotW} height={yLo - yHi} className="high-fill" />
                    ) : null,
                  )}
                  <path d={wavePath(row.bits, yHi, yLo)} className={`wave ${row.input < 0 ? 'out' : ''}`} />

                  {row.input >= 0 &&
                    row.bits.map((_, s) => (
                      <rect
                        key={s}
                        data-flip
                        x={xAt(s)}
                        y={y0 + 2}
                        width={slotW}
                        height={rowH - 4}
                        className="flip-target"
                        onClick={() => {
                          ex.flip(ex.focus, row.input, s);
                          ex.setCursor(s);
                        }}
                      >
                        <title>{`Flip ${row.label} at step ${s}`}</title>
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
          <button onClick={() => ex.step(-1)} aria-label="Previous step">◀</button>
          <button className="play" onClick={() => ex.setPlaying(!ex.playing)}>
            {ex.playing ? '❚❚ Pause' : '▶ Play'}
          </button>
          <button onClick={() => ex.step(1)} aria-label="Next step">▶</button>
          <span className="muted step-readout">
            Step {ex.cursor} / {STEPS - 1}
          </span>
        </div>
        <div className="btn-row">
          <span className="muted">Inputs:</span>
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => ex.applyPreset(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <span className="muted hint">Drag to scrub · click an input step to flip it · ← → keys</span>
      </div>
    </section>
  );
}
