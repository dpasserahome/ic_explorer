import type { GateDef, GateKind, PinDef } from '../sim/types';

type Pinout = { pins: PinDef[]; gates: GateDef[] };

/**
 * Builds pins and gates for a 14-pin chip from one group per gate (input pins in A, B order, then
 * the output pin). Pin names follow the datasheet: 1A, 1B, 1Y, ... with GND on 7 and VCC on 14.
 */
function fromGroups(kind: GateKind, groups: { inputs: number[]; y: number }[]): Pinout {
  const pins: PinDef[] = [
    { num: 7, name: 'GND', role: 'gnd' },
    { num: 14, name: 'VCC', role: 'vcc' },
  ];
  const gates: GateDef[] = groups.map((g, i) => {
    const id = i + 1;
    g.inputs.forEach((num, k) => pins.push({ num, name: `${id}${'AB'[k]}`, role: 'input' }));
    pins.push({ num: g.y, name: `${id}Y`, role: 'output' });
    return { id, kind, inputs: g.inputs, output: g.y };
  });
  pins.sort((p, q) => p.num - q.num);
  return { pins, gates };
}

/**
 * Standard quad 2-input pinout shared by the 7400, 7408, 7432 and 7486:
 * gates 1–2 on pins 1–6, gates 3–4 on pins 8–13 (output first on that side).
 */
export function standardQuad2(kind: GateKind): Pinout {
  return fromGroups(kind, [
    { inputs: [1, 2], y: 3 },
    { inputs: [4, 5], y: 6 },
    { inputs: [9, 10], y: 8 },
    { inputs: [12, 13], y: 11 },
  ]);
}

/** 7402 quad 2-input NOR: every gate's output pin comes before its inputs. */
export function norQuad2(): Pinout {
  return fromGroups('NOR', [
    { inputs: [2, 3], y: 1 },
    { inputs: [5, 6], y: 4 },
    { inputs: [8, 9], y: 10 },
    { inputs: [11, 12], y: 13 },
  ]);
}

/** 7404 hex inverter: six input/output pairs, input first on the left, output first on the right. */
export function hexInverter(): Pinout {
  return fromGroups('NOT', [
    { inputs: [1], y: 2 },
    { inputs: [3], y: 4 },
    { inputs: [5], y: 6 },
    { inputs: [9], y: 8 },
    { inputs: [11], y: 10 },
    { inputs: [13], y: 12 },
  ]);
}
