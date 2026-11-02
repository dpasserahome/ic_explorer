import type { GateKind } from '../sim/types';

export interface GateGeom {
  body: string;
  /** Second back curve for XOR. */
  extra?: string;
  bubble?: { cx: number; cy: number; r: number };
  /** x where an input wire should stop at local height y (0..h). */
  inputX: (y: number) => number;
  /** x of the output point (after the bubble, if any). */
  outX: number;
}

/** Distinctive-shape (ANSI) gate outline in a local box of height h, pointing right, origin top-left. */
export function gateGeom(kind: GateKind, h: number): GateGeom {
  const r = h * 0.09;
  const inverted = kind === 'NAND' || kind === 'NOR' || kind === 'NOT';
  let body: string;
  let width: number;
  let extra: string | undefined;
  let inputX: (y: number) => number = () => 0;

  if (kind === 'AND' || kind === 'NAND') {
    width = h;
    body = `M0,0 H${h / 2} A${h / 2},${h / 2} 0 0 1 ${h / 2},${h} H0 Z`;
  } else if (kind === 'NOT') {
    width = h * 0.85;
    body = `M0,0 L${width},${h / 2} L0,${h} Z`;
  } else {
    width = h * 1.1;
    body = `M0,0 Q${h * 0.3},${h / 2} 0,${h} Q${h * 0.75},${h} ${width},${h / 2} Q${h * 0.75},0 0,0 Z`;
    // Back curve is a quadratic bulging to 0.15h; wires end on it.
    inputX = (y) => 0.6 * h * (y / h) * (1 - y / h);
    if (kind === 'XOR') {
      const o = -h * 0.18;
      extra = `M${o},0 Q${o + h * 0.3},${h / 2} ${o},${h}`;
      inputX = (y) => o + 0.6 * h * (y / h) * (1 - y / h);
    }
  }

  return {
    body,
    extra,
    bubble: inverted ? { cx: width + r, cy: h / 2, r } : undefined,
    inputX,
    outX: width + (inverted ? 2 * r : 0),
  };
}

export function GateBody({ geom, className = 'gate-body' }: { geom: GateGeom; className?: string }) {
  return (
    <>
      <path d={geom.body} className={className} />
      {geom.extra && <path d={geom.extra} className={className} fill="none" />}
      {geom.bubble && <circle {...geom.bubble} className={className} />}
    </>
  );
}
