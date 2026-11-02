import type { GateDef, GateKind, PinDef } from '../sim/types';

/**
 * Standard quad 2-input pinout shared by the 7400, 7408, 7432 and 7486:
 * gates 1–2 on pins 1–6, gates 3–4 on pins 8–13 (output first on that side).
 * The 7402 (NOR) uses a different layout.
 */
export function standardQuad2(kind: GateKind): { pins: PinDef[]; gates: GateDef[] } {
  const groups = [
    { a: 1, b: 2, y: 3 },
    { a: 4, b: 5, y: 6 },
    { a: 9, b: 10, y: 8 },
    { a: 12, b: 13, y: 11 },
  ];
  const pins: PinDef[] = [
    { num: 7, name: 'GND', role: 'gnd' },
    { num: 14, name: 'VCC', role: 'vcc' },
  ];
  const gates: GateDef[] = groups.map((g, i) => {
    const id = i + 1;
    pins.push(
      { num: g.a, name: `${id}A`, role: 'input' },
      { num: g.b, name: `${id}B`, role: 'input' },
      { num: g.y, name: `${id}Y`, role: 'output' },
    );
    return { id, kind, inputs: [g.a, g.b], output: g.y };
  });
  pins.sort((p, q) => p.num - q.num);
  return { pins, gates };
}
