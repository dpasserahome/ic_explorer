import { mux157 } from '../sim/msi';
import type { Bit, BlockChipDef, BlockUnit, LogicNode } from '../sim/types';
import { bitRows, gate, nameOf, not, patternTable, pin, pinList, X } from './blocks';

// Pin names follow the 74HC157 datasheet (S, ~E, nI0, nI1, nY). TI's SN74157 calls them A/~B,
// ~G, nA, nB, nY. The deck lists this chip only in its multiplexer table (slide 68).
const PINS = pinList([
  [1, 'S', 'input'],
  [2, '1I0', 'input'],
  [3, '1I1', 'input'],
  [4, '1Y', 'output'],
  [5, '2I0', 'input'],
  [6, '2I1', 'input'],
  [7, '2Y', 'output'],
  [8, 'GND', 'gnd'],
  [9, '3Y', 'output'],
  [10, '3I1', 'input'],
  [11, '3I0', 'input'],
  [12, '4Y', 'output'],
  [13, '4I1', 'input'],
  [14, '4I0', 'input'],
  [15, '~E', 'input'],
  [16, 'VCC', 'vcc'],
]);

// Four sections that share S (pin 1) and ~E (pin 15). Each: inputs ~E, S, I0, I1; output Y.
const UNITS: BlockUnit[] = [
  { label: 'Mux 1', inputs: [15, 1, 2, 3], outputs: [4] },
  { label: 'Mux 2', inputs: [15, 1, 5, 6], outputs: [7] },
  { label: 'Mux 3', inputs: [15, 1, 11, 10], outputs: [9] },
  { label: 'Mux 4', inputs: [15, 1, 14, 13], outputs: [12] },
];

// Datasheet logic diagram: two AND gates per section (I0 with S LOW, I1 with S HIGH), both
// gated by the enable, into an OR.
const E: LogicNode = gate('NOT', [pin(15)], 'E');

/** S LOW for steps 0–7 then HIGH; I0 changes every step, I1 every two steps. */
const switching = (s: number, e: Bit = 0): Bit[] => [e, s >= 8 ? 1 : 0, (s & 1) as Bit, ((s >> 1) & 1) as Bit];

export const c74157: BlockChipDef = {
  kind: 'block',
  part: '74157',
  title: 'Quad 2-to-1 line multiplexer',
  subtitle: 'Data selector · 16-pin DIP',
  overview:
    'Four 2-to-1 multiplexers sharing one select S and one enable ~E. S = 0 passes each nI0 to its ' +
    'output, S = 1 each nI1, switching a 4-bit word between two sources. ~E HIGH holds outputs LOW.',
  readAs: 'Y equals I0 when S is LOW, I1 when S is HIGH',
  formula: 'nY = S′ · nI0 + S · nI1',
  blockLabel: 'Quad 2-to-1 mux',
  pins: PINS,
  units: UNITS,
  evaluate: mux157,
  // As on the datasheet: the output cell names the data input Y follows.
  functionTable: (u) => patternTable(PINS, UNITS[u].inputs, [15, 1], [[1, X], [0, 0], [0, 1]]),
  pinInfo: {
    1: 'Select S, shared by all four sections: LOW passes each nI0, HIGH each nI1.',
    15: 'Enable ~E, shared, active LOW: while HIGH, every output is held LOW.',
    ...Object.fromEntries(
      UNITS.flatMap((u, k) => [
        [u.inputs[2], `Data input ${k + 1}I0 of section ${k + 1}: reaches ${k + 1}Y when S is LOW.`],
        [u.inputs[3], `Data input ${k + 1}I1 of section ${k + 1}: reaches ${k + 1}Y when S is HIGH.`],
        [u.outputs[0], `Output ${k + 1}Y of section ${k + 1}.`],
      ]),
    ),
  },
  status: ([e, s, i0, i1], _outs, u) => {
    const n = u + 1;
    if (e === 1) return `Disabled (~E is HIGH), so ${n}Y = 0`;
    return s === 0 ? `S = 0, so ${n}Y = ${n}I0 = ${i0}` : `S = 1, so ${n}Y = ${n}I1 = ${i1}`;
  },
  timing: (u) => ({ inputs: bitRows(PINS, UNITS[u].inputs), outputs: bitRows(PINS, UNITS[u].outputs) }),
  logic: (u) => {
    const [, s, i0, i1] = UNITS[u].inputs;
    const out = UNITS[u].outputs[0];
    return [
      {
        tab: nameOf(PINS, out),
        out,
        node: gate('OR', [gate('AND', [E, not(pin(s)), pin(i0)]), gate('AND', [E, pin(s), pin(i1)])]),
      },
    ];
  },
  presets: [
    { id: 'switch', label: 'Switch S', at: (s) => switching(s) },
    { id: 'enable', label: 'Enable off', at: (s) => switching(s, s >= 4 && s < 6 ? 1 : s >= 12 && s < 14 ? 1 : 0) },
  ],
};
